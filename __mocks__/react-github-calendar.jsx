/**
 * Mock: react-github-calendar
 * 
 * Mocks the GitHub contribution calendar component.
 * Renders a placeholder instead of fetching real GitHub data.
 * 
 * This avoids network requests during tests and provides
 * consistent, predictable output.
 */

import React from 'react';

/**
 * Mock contribution data for testing
 */
export const mockContributions = [
    { date: '2024-01-01', count: 5, level: 2 },
    { date: '2024-01-02', count: 0, level: 0 },
    { date: '2024-01-03', count: 12, level: 4 },
    { date: '2024-01-04', count: 3, level: 1 },
    { date: '2024-01-05', count: 7, level: 3 },
];

/**
 * Mock GitHubCalendar component
 * 
 * Renders a simple placeholder with the username and testid.
 * Supports the transformData callback for testing data processing.
 */
const GitHubCalendar = React.forwardRef(({
    username,
    transformData,
    blockMargin,
    blockRadius,
    blockSize,
    colorScheme,
    dateFormat,
    fontSize,
    hideColorLegend,
    hideMonthLabels,
    hideTotalCount,
    labels,
    showWeekdayLabels,
    style,
    theme,
    throwOnError,
    totalCount,
    weekStart,
    year,
    ...props
}, ref) => {
    // Call transformData if provided, for testing data transformation logic
    React.useEffect(() => {
        if (transformData) {
            transformData(mockContributions);
        }
    }, [transformData]);

    return (
        <div
            ref={ref}
            data-testid="github-calendar"
            data-username={username}
            style={style}
            {...props}
        >
            <div data-testid="github-calendar-grid">
                {/* Placeholder for the contribution grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(52, 10px)',
                        gap: '2px',
                        padding: '10px',
                    }}
                >
                    {Array.from({ length: 52 * 7 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: blockSize || 10,
                                height: blockSize || 10,
                                backgroundColor: i % 5 === 0 ? '#40c463' : '#ebedf0',
                                borderRadius: blockRadius || 2,
                            }}
                        />
                    ))}
                </div>
            </div>

            {!hideTotalCount && (
                <div data-testid="github-calendar-total">
                    {totalCount ?? 104} contributions in the last year
                </div>
            )}

            {!hideColorLegend && (
                <div data-testid="github-calendar-legend">
                    Less — More
                </div>
            )}
        </div>
    );
});

GitHubCalendar.displayName = 'MockGitHubCalendar';

// Named export (how react-github-calendar exports it)
export { GitHubCalendar };

// Default export
export default GitHubCalendar;




