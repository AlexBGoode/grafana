import { css } from '@emotion/css';
import { type ReactNode } from 'react';
import Skeleton from 'react-loading-skeleton';

import { type GrafanaTheme2 } from '@grafana/data';
import { Trans, t } from '@grafana/i18n';
import { Button, Icon, IconButton, Stack, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';

import { makeFolderAlertsLink } from '../../utils/misc';
import { FolderPath } from '../rule-row/FolderPath';
import { ruleCountLabel } from '../rule-row/ResultCount';
import { type RuleKind } from '../shared/ruleKind';

import { type FolderRuleCount } from './folderLookups';

interface FolderListRowProps {
  folderUid: string;
  title: string;
  kind: RuleKind;
  /** Ancestor titles, outermost first; excludes the folder itself, which the title already shows. */
  parents: string[];
  /** Direct count for this rule kind only, never descendants. */
  count: FolderRuleCount;
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function FolderListRow({
  folderUid,
  title,
  kind,
  parents,
  count,
  expanded,
  onToggle,
  children,
}: FolderListRowProps) {
  const styles = useStyles2(getStyles);

  return (
    <li className={styles.wrapper}>
      <div className={styles.header}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Stack direction="row" alignItems="center" gap={0.5} flex="1" minWidth={0}>
            <IconButton
              name={expanded ? 'angle-down' : 'angle-right'}
              aria-expanded={expanded}
              aria-label={
                expanded
                  ? t('alerting.gma-rule-list.folder-row.collapse', 'Collapse {{title}}', {
                      interpolation: { escapeValue: false },
                      title,
                    })
                  : t('alerting.gma-rule-list.folder-row.expand', 'Expand {{title}}', {
                      interpolation: { escapeValue: false },
                      title,
                    })
              }
              onClick={onToggle}
            />
            <Icon name="folder" />
            <TextLink href={makeFolderAlertsLink(folderUid, title)} color="primary" inline={false}>
              {title}
            </TextLink>
            {parents.length > 0 && <FolderPath segments={parents} showIcon={false} />}
          </Stack>
          <FolderCount kind={kind} count={count} title={title} />
        </Stack>
      </div>
      {expanded && <ul className={styles.group}>{children}</ul>}
    </li>
  );
}

function FolderCount({ kind, count, title }: { kind: RuleKind; count: FolderRuleCount; title: string }) {
  if (count.status === 'loading') {
    return <Skeleton width={64} />;
  }
  if (count.status === 'error') {
    return (
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Text variant="bodySmall" color="secondary">
          <Trans i18nKey="alerting.gma-rule-list.folder-row.count-unavailable">Count unavailable</Trans>
        </Text>
        <Button
          size="sm"
          variant="secondary"
          fill="text"
          icon="sync"
          aria-label={t(
            'alerting.gma-rule-list.folder-row.count-retry-label',
            'Retry loading the rule count of {{title}}',
            {
              interpolation: { escapeValue: false },
              title,
            }
          )}
          onClick={count.retry}
        >
          <Trans i18nKey="alerting.gma-rule-list.folder-row.count-retry">Retry</Trans>
        </Button>
      </Stack>
    );
  }
  const countLabel = ruleCountLabel(kind, count.count);
  const explanation = t(
    'alerting.gma-rule-list.folder-row.count-tooltip',
    'Rules directly in this folder. Subfolders are listed separately.'
  );
  // The span is not focusable, so the explanation is part of its name rather than only a hover tooltip.
  const accessibleName = t('alerting.gma-rule-list.folder-row.count-description', '{{label}}. {{explanation}}', {
    interpolation: { escapeValue: false },
    label: countLabel,
    explanation,
  });

  return (
    <Tooltip content={explanation}>
      <span role="img" aria-label={accessibleName}>
        <Text variant="bodySmall" color="secondary">
          {countLabel}
        </Text>
      </span>
    </Tooltip>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
  }),
  header: css({
    padding: theme.spacing(1, 1.5),

    // Not action.hover: it drops secondary text below 4.5:1 contrast in the dark theme.
    '&:hover': {
      background: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
    },
  }),
  // The guide line sits at the chevron's centre so nested rows read as belonging to the folder.
  group: css({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    paddingLeft: theme.spacing(4),
    position: 'relative',

    '&:before': {
      content: "''",
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: theme.spacing(2.5),
      borderLeft: `solid 1px ${theme.colors.border.weak}`,
    },
  }),
});
