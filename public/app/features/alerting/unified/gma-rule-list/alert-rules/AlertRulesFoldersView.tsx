import { useState } from 'react';

import { t } from '@grafana/i18n';
import { Box, EmptyState, LoadingPlaceholder, Stack, Text } from '@grafana/ui';

import LoadMoreHelper from '../../rule-list/LoadMoreHelper';
import { FolderListRow } from '../folder-browsing/FolderListRow';
import { useFolderPath, useFolderRuleCount } from '../folder-browsing/folderLookups';
import { useFolderList } from '../folder-browsing/folderSearch';
import { RuleListSkeleton } from '../rule-row/RuleListSkeleton';
import { RuleRowList } from '../rule-row/RuleRowList';
import { createEmptyFilter } from '../rule-search/ruleSearchFilter';
import { InlineRequestError } from '../shared/InlineRequestError';
import { LoadMoreFooter } from '../shared/LoadMoreFooter';

import { AlertRuleListEntry } from './AlertRuleListEntry';
import { useAlertRuleSearch } from './alertRuleSearch';

interface FoldersViewProps {
  /** The only filter Folders mode supports; scopes the folder listing itself. */
  folderUids: string[];
}

export function AlertRulesFoldersView({ folderUids }: FoldersViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { folders, isLoading, error, failure, hasMore, isLoadingMore, loadMore, retry } = useFolderList(folderUids);

  const toggle = (uid: string) => {
    setExpanded((prev) => {
      const updated = new Set(prev);
      if (updated.has(uid)) {
        updated.delete(uid);
      } else {
        updated.add(uid);
      }
      return updated;
    });
  };

  if (isLoading) {
    return <LoadingPlaceholder text={t('alerting.gma-rule-list.alert-rules.loading-folders', 'Loading folders...')} />;
  }

  if (error !== undefined) {
    return (
      <InlineRequestError
        title={t('alerting.gma-rule-list.alert-rules.folders-error', 'Failed to load folders')}
        error={error}
        onRetry={retry}
      />
    );
  }

  if (folders.length === 0 && !failure) {
    // Folders are listed by the label marking folders that hold rules of either kind, so a filter matching
    // none of them means the folder holds no rules at all.
    return (
      <EmptyState
        variant="not-found"
        message={
          folderUids.length > 0
            ? t('alerting.gma-rule-list.alert-rules.no-rules-match-folder', 'No alert rules match this folder')
            : t('alerting.gma-rule-list.alert-rules.no-rules', 'No alert rules found')
        }
      />
    );
  }

  return (
    <Stack direction="column" gap={2}>
      <RuleRowList>
        {folders.map((folder) => (
          <AlertFolderListEntry
            key={folder.uid}
            folderUid={folder.uid}
            title={folder.title}
            expanded={expanded.has(folder.uid)}
            onToggle={() => toggle(folder.uid)}
          />
        ))}
      </RuleRowList>
      {/* Wrapped so the zero-height helper is not a flex item that adds a gap while it is mounted. */}
      <div>
        {/* An observer only reports changes, so the helper is unmounted while a page loads and remounted to check
            again whether the end of the list is still in view. A failure stays set while Retry reloads. */}
        {hasMore && !isLoadingMore && !failure && <LoadMoreHelper handleLoad={loadMore} />}
        <LoadMoreFooter
          label={t('alerting.gma-rule-list.alert-rules.load-more-folders', 'Load more folders')}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          failure={failure}
          onLoadMore={loadMore}
          onRetry={retry}
        />
      </div>
    </Stack>
  );
}

interface AlertFolderListEntryProps {
  folderUid: string;
  title: string;
  expanded: boolean;
  onToggle: () => void;
}

/** Runs the per-folder lookups once so the row stays presentation-only. */
function AlertFolderListEntry({ folderUid, title, expanded, onToggle }: AlertFolderListEntryProps) {
  const path = useFolderPath(folderUid);
  const count = useFolderRuleCount(folderUid, 'alert');
  // The last segment is the folder itself, already shown as the title.
  const parents = path ? path.slice(0, -1) : [];

  return (
    <FolderListRow
      folderUid={folderUid}
      title={title}
      kind="alert"
      parents={parents}
      count={count}
      expanded={expanded}
      onToggle={onToggle}
    >
      <ExpandedFolderRules folderUid={folderUid} title={title} />
    </FolderListRow>
  );
}

function ExpandedFolderRules({ folderUid, title }: { folderUid: string; title: string }) {
  const { items, isLoading, error, failure, hasMore, isLoadingMore, loadMore, retry } = useAlertRuleSearch({
    ...createEmptyFilter(),
    folders: [folderUid],
  });

  const retryLabel = t('alerting.gma-rule-list.alert-rules.retry-rules-in-folder', 'Retry loading rules in {{title}}', {
    interpolation: { escapeValue: false },
    title,
  });

  if (isLoading) {
    return (
      <li>
        <RuleListSkeleton />
      </li>
    );
  }

  if (error !== undefined) {
    return (
      <li>
        <InlineRequestError
          title={t('alerting.gma-rule-list.alert-rules.rules-error', 'Failed to load rules')}
          error={error}
          onRetry={retry}
          retryLabel={retryLabel}
        />
      </li>
    );
  }

  if (items.length === 0 && !failure) {
    return (
      <li>
        <Box padding={1}>
          <Text color="secondary">
            {t('alerting.gma-rule-list.alert-rules.no-rules-in-folder', 'No alert rules in this folder')}
          </Text>
        </Box>
      </li>
    );
  }

  return (
    <>
      {items.map((searchHit) => (
        <AlertRuleListEntry key={searchHit.uid} searchHit={searchHit} showFolderPath={false} />
      ))}
      {(hasMore || failure) && (
        <li>
          <LoadMoreFooter
            label={t('alerting.gma-rule-list.alert-rules.load-more-rules-in-folder', 'Load more rules in {{title}}', {
              interpolation: { escapeValue: false },
              title,
            })}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            failure={failure}
            onLoadMore={loadMore}
            onRetry={retry}
            retryLabel={retryLabel}
          />
        </li>
      )}
    </>
  );
}
