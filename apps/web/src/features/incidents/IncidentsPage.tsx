// apps/web/src/features/incidents/IncidentsPage.tsx

import {
    useInfiniteQuery,
} from '@tanstack/react-query';
import {
    fetchIncidents,
} from '../../api/incidents';

export function IncidentsPage() {
    const query = useInfiniteQuery({
        queryKey: ['incidents'],
        queryFn: ({ pageParam }) =>
            fetchIncidents(pageParam),
        initialPageParam:
            undefined as string | undefined,
        getNextPageParam: (lastPage) =>
            lastPage.nextCursor ??
            undefined,
    });

    if (query.isPending) {
        return (
            <main>
                <h1>OpsFlow incidents</h1>
                <p role="status">
                    Loading incidents…
                </p>
            </main>
        );
    }

    if (query.isError) {
        return (
            <main>
                <h1>OpsFlow incidents</h1>
                <p role="alert">
                    Incidents could not be loaded.
                </p>

                <button
                    type="button"
                    onClick={() => {
                        void query.refetch();
                    }}
                >
                    Try again
                </button>
            </main>
        );
    }

    const incidents =
        query.data.pages.flatMap(
            (page) => page.items,
        );

    return (
        <main>
            <h1>OpsFlow incidents</h1>

            {incidents.length === 0 ? (
                <p>No incidents reported.</p>
            ) : (
                <ul aria-label="Incidents">
                    {incidents.map((incident) => (
                        <li key={incident.id}>
                            <article>
                                <header>
                                    <h2>{incident.title}</h2>
                                    <span>
                                        {incident.priority}
                                    </span>
                                </header>

                                {incident.description && (
                                    <p>
                                        {incident.description}
                                    </p>
                                )}

                                <p>
                                    Status: {incident.status}
                                </p>

                                <time
                                    dateTime={
                                        incident.createdAt
                                    }
                                >
                                    {new Intl.DateTimeFormat(
                                        undefined,
                                        {
                                            dateStyle: 'medium',
                                            timeStyle: 'short',
                                        },
                                    ).format(
                                        new Date(
                                            incident.createdAt,
                                        ),
                                    )}
                                </time>
                            </article>
                        </li>
                    ))}
                </ul>
            )}

            {query.hasNextPage && (
                <button
                    type="button"
                    disabled={
                        query.isFetchingNextPage
                    }
                    onClick={() => {
                        void query.fetchNextPage();
                    }}
                >
                    {query.isFetchingNextPage
                        ? 'Loading…'
                        : 'Load more'}
                </button>
            )}
        </main>
    );
}