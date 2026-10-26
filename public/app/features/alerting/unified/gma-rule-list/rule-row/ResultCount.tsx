import Skeleton from 'react-loading-skeleton';

import { t } from '@grafana/i18n';
import { Text } from '@grafana/ui';

import { type RuleKind } from '../shared/ruleKind';

export interface ResultTotal {
  count: number;
  /** `lte` means the backend reported a lower bound rather than an exact count. */
  isLowerBound: boolean;
}

interface ResultCountProps {
  kind: RuleKind;
  /** Absent when the response carried no total: nothing is shown rather than a count of loaded rows. */
  total?: ResultTotal;
  isLoading?: boolean;
}

export function ResultCount({ kind, total, isLoading = false }: ResultCountProps) {
  if (isLoading) {
    return <Skeleton width={96} />;
  }
  if (total === undefined) {
    return null;
  }

  return (
    <Text variant="bodySmall" color="secondary" element="p">
      {ruleCountLabel(kind, total.count, total.isLowerBound)}
    </Text>
  );
}

/** "12 alert rules", with the number formatted for the locale and a `+` when it is only a lower bound. */
export function ruleCountLabel(kind: RuleKind, count: number, isLowerBound = false): string {
  const formatted = new Intl.NumberFormat().format(count) + (isLowerBound ? '+' : '');
  if (kind === 'alert') {
    return t('alerting.gma-rule-list.result-count.alert-rules', '', {
      count,
      formatted,
      defaultValue_one: '{{formatted}} alert rule',
      defaultValue_other: '{{formatted}} alert rules',
    });
  }
  return t('alerting.gma-rule-list.result-count.recording-rules', '', {
    count,
    formatted,
    defaultValue_one: '{{formatted}} recording rule',
    defaultValue_other: '{{formatted}} recording rules',
  });
}
