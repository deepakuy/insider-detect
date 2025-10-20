import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from scipy.stats import entropy
import redis
import json
from typing import Dict, Any

class FeatureEngineer:
    """
    Computes behavioral features for insider threat/anomaly detection.
    Includes both batch (offline) and single (streaming) event methods.
    """

    def __init__(self, redis_client=None):
        self.redis = redis_client
        self.feature_columns = [
            'login_count_1h',
            'failed_login_rate_1h',
            'bytes_transferred_1h',
            'unique_dst_ips_1h',
            'unique_files_24h',
            'off_hours_ratio_24h',
            'privilege_change_flag',
            'geo_anomaly_score',
            'dst_ip_entropy_1h'
        ]

    def compute_batch_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all rolling/statistical features for batch DataFrame.
        Used in model training and offline analysis."""
        print(" Computing batch features...")
        df = df.copy()
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values(['user_id', 'timestamp'])

        all_features = []

        for user, group in df.groupby('user_id'):
            group = group.set_index('timestamp')

            # Numeric masks for robust rolling ops
            group['is_login_success'] = (group['event_type'] == 'login_success').astype(int)
            group['is_login_fail'] = (group['event_type'] == 'login_fail').astype(int)
            group['is_off_hours'] = group.index.to_series().dt.hour.map(lambda h: 1 if (h < 6 or h >= 18) else 0)

            # Simple numeric rollups
            group['login_count_1h'] = group['is_login_success'].rolling('1H').sum().fillna(0)
            logins_1h = (group['is_login_success'] + group['is_login_fail']).rolling('1H').sum()
            fails_1h = group['is_login_fail'].rolling('1H').sum()
            group['failed_login_rate_1h'] = (fails_1h / logins_1h.replace(0, np.nan)).fillna(0)
            group['bytes_transferred_1h'] = group['bytes_transferred'].rolling('1H').sum().fillna(0)

            # Off-hours ratio over 24h as rolling mean of the flag
            group['off_hours_ratio_24h'] = group['is_off_hours'].rolling('24H').mean().fillna(0)

            # Sliding-window uniques and entropy for dst_ip (1h) and files (24h)
            from collections import deque, Counter

            one_hour_window: deque = deque()
            one_hour_counts: Counter = Counter()
            one_hour_entropy: list[float] = []
            one_hour_uniques: list[int] = []

            twentyfour_window: deque = deque()
            twentyfour_counts: Counter = Counter()
            twentyfour_uniques: list[int] = []

            def update_window(window, counts, current_time, max_delta):
                # Evict old entries
                while window and (current_time - window[0][0]) > max_delta:
                    old_time, old_val = window.popleft()
                    counts[old_val] -= 1
                    if counts[old_val] <= 0:
                        del counts[old_val]

            # Iterate in timestamp order
            for ts, row in group.sort_index().iterrows():
                # 1H dst_ip uniques + entropy
                update_window(one_hour_window, one_hour_counts, ts, pd.Timedelta(hours=1))
                if isinstance(row.get('dst_ip', ''), str) and row['dst_ip']:
                    one_hour_window.append((ts, row['dst_ip']))
                    one_hour_counts[row['dst_ip']] += 1
                one_hour_uniques.append(len(one_hour_counts))
                if one_hour_counts:
                    probs = np.array(list(one_hour_counts.values()), dtype=float)
                    probs = probs / probs.sum()
                    one_hour_entropy.append(float(entropy(probs)))
                else:
                    one_hour_entropy.append(0.0)

                # 24H unique files
                update_window(twentyfour_window, twentyfour_counts, ts, pd.Timedelta(hours=24))
                fname = row.get('file_name', '')
                if isinstance(fname, str) and fname:
                    twentyfour_window.append((ts, fname))
                    twentyfour_counts[fname] += 1
                twentyfour_uniques.append(len(twentyfour_counts))

            group_sorted = group.sort_index().copy()
            group_sorted['unique_dst_ips_1h'] = one_hour_uniques
            group_sorted['dst_ip_entropy_1h'] = one_hour_entropy
            group_sorted['unique_files_24h'] = twentyfour_uniques

            # Remaining simple flags
            group_sorted['privilege_change_flag'] = (group_sorted['event_type'] == 'privilege_escalation').astype(int)
            group_sorted['geo_anomaly_score'] = (group_sorted.get('geo_country', 'US') != 'US').astype(int) if 'geo_country' in group_sorted.columns else 0

            # Drop helper cols
            group_sorted = group_sorted.drop(columns=['is_login_success', 'is_login_fail', 'is_off_hours'])

            all_features.append(group_sorted.reset_index())
        result = pd.concat(all_features, ignore_index=True)
        print(f"    Computed {len(self.feature_columns)} features for {len(result)} events")
        return result

    # (Real-time features/class omitted for now - focus on batch)

if __name__ == "__main__":
    print(" Testing Feature Engineering ...\n")
    # Test batch processing
    print("1 Testing Batch Features:")
    df = pd.read_csv(r'F:\APT Detector\data\synthetic_events.csv')
    engineer = FeatureEngineer()
    df_with_features = engineer.compute_batch_features(df.head(1000))

    # Debug summary
    print(f"\n... features dataframe size: {df_with_features.shape}")
    print(f"Sample user_ids: {df_with_features['user_id'].unique()[:5]}")

    # Pick a present user_id dynamically
    if not df_with_features.empty:
        picked_user = df_with_features['user_id'].iloc[0]
        print(f"\nSample features for {picked_user}:")
        sample = df_with_features[df_with_features['user_id'] == picked_user].head(3)
        print(sample[['user_id', 'timestamp', 'login_count_1h', 'bytes_transferred_1h']].to_string())
    else:
        print("No features computed in the current slice.")
