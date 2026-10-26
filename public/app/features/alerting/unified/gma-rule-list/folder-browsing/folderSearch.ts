import { useCallback, useMemo } from 'react';
import * as z from 'zod';

import { generatedAPI as folderAPI } from '@grafana/api-clients/rtkq/folder/v1beta1';

import { type PagedFailure } from '../shared/PagedFailureAlert';

import { buildFolderListSearchQuery } from './folderSearchQuery';

interface FolderHit {
  uid: string;
  title: string;
}

interface FolderSearchPage {
  folders: FolderHit[];
  continueToken?: string;
}

const folderHitSchema = z
  .object({
    resource: z.object({ name: z.string() }),
    // A missing or malformed title falls back to the UID instead of failing the page.
    fields: z.object({ title: z.string().optional().catch(undefined) }).catch({}),
  })
  .transform(({ resource, fields }): FolderHit => ({ uid: resource.name, title: fields.title ?? resource.name }));

// Only what the listing reads.
const folderSearchResponseSchema = z.object({
  items: z.array(folderHitSchema),
  metadata: z.object({ continue: z.string().optional() }),
});

type FolderSearchResponse = z.infer<typeof folderSearchResponseSchema>;

/**
 * Infinite query keyed by folder filter, so a new filter starts again from the first page. The
 * generated search is a POST mutation with no tags or page state.
 */
const folderSearchAPI = folderAPI.injectEndpoints({
  endpoints: (build) => ({
    searchRuleFolders: build.infiniteQuery<FolderSearchPage, { folderUids: string[] }, string | undefined>({
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => lastPage.continueToken || undefined,
      },
      // Results are a view of the current page only: leaving it drops them, and coming back searches again.
      keepUnusedDataFor: 0,
      query: ({ queryArg, pageParam }) => ({
        url: '/folders/search',
        method: 'POST',
        body: buildFolderListSearchQuery(pageParam, queryArg.folderUids),
      }),
      rawResponseSchema: folderSearchResponseSchema,
      // A response that fails the schema becomes a query error, so the page shows it with Retry.
      catchSchemaFailure: (error) => ({ message: error.message }),
      transformResponse: (response: FolderSearchResponse): FolderSearchPage => ({
        folders: response.items,
        continueToken: response.metadata.continue,
      }),
    }),
  }),
});

const { useSearchRuleFoldersInfiniteQuery } = folderSearchAPI;

/** Every loaded page of folders as one list that grows as the next page is requested. */
export function useFolderList(folderUids: string[]) {
  const query = useSearchRuleFoldersInfiniteQuery({ folderUids });
  const { currentData, isError, error, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } = query;
  // Missing from the result type of a query that has not started.
  const isFetchNextPageError = 'isFetchNextPageError' in query && query.isFetchNextPageError;

  // currentData, not data: while the arguments change, data still holds the previous arguments' pages.
  const pages = currentData?.pages;
  const folders = useMemo(() => pages?.flatMap((page) => page.folders) ?? [], [pages]);
  const hasLoaded = pages !== undefined;
  const failure: PagedFailure | undefined =
    hasLoaded && isError ? { kind: isFetchNextPageError ? 'load-more' : 'refresh', error } : undefined;

  const loadMore = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);

  return {
    folders,
    isLoading: !hasLoaded && !isError,
    // A failed first page replaces the list; a later failure keeps the loaded folders and reports `failure`.
    error: !hasLoaded && isError ? error : undefined,
    failure,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    loadMore,
    // Refetching reloads every loaded page with fresh continuation tokens, so it also recovers from an expired one.
    retry: () => {
      void refetch();
    },
  };
}
