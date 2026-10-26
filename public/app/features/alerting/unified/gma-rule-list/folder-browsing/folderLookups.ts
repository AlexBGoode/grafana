import { skipToken } from '@reduxjs/toolkit/query';

import {
  type FolderInfo,
  useGetFolderCountsQuery,
  useGetFolderParentsQuery,
} from '@grafana/api-clients/rtkq/folder/v1beta1';
import { getParsedCounts } from 'app/api/clients/folder/v1beta1/utils';

import { type RuleKind } from '../shared/ruleKind';

export function useFolderPath(folderUid: string | undefined): string[] | undefined {
  const { data } = useGetFolderParentsQuery(folderUid ? { name: folderUid } : skipToken);
  return data?.items.map((folder: FolderInfo) => folder.title);
}

/** A folder's count for one rule kind; `error` means the `/counts` lookup failed, not that it is pending. */
export type FolderRuleCount =
  | { status: 'loading' }
  | { status: 'loaded'; count: number }
  | { status: 'error'; retry: () => void };

export function useFolderRuleCount(folderUid: string, kind: RuleKind): FolderRuleCount {
  // Counts change when a rule is created or duplicated in the editor, outside these queries.
  const { data, isError, refetch } = useGetFolderCountsQuery({ name: folderUid }, { refetchOnMountOrArgChange: true });
  // A failed refetch keeps the last good count, so the row only reports an error when it has nothing to show.
  if (data) {
    // The response omits resources the folder holds none of. getParsedCounts keeps the Unified Storage
    // entry over the SQL fallback one, so a rule is not counted twice.
    return { status: 'loaded', count: getParsedCounts(data.counts)[COUNTS_RESOURCE[kind]] ?? 0 };
  }
  return isError ? { status: 'error', retry: refetch } : { status: 'loading' };
}

const COUNTS_RESOURCE: Record<RuleKind, string> = { alert: 'alertrules', recording: 'recordingrules' };
