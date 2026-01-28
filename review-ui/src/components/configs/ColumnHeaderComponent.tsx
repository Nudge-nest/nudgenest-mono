import { FC } from 'react';

interface IColumnHeaderComponentProps {
    columns: string[];
}

const ColumnHeaderComponent: FC<IColumnHeaderComponentProps> = ({ columns }) => {
    return (
        <header
            className="grid grid-cols-3 gap-6 py-3 px-6 mb-4 border-b border-[color:var(--color-gray)]"
            role="row"
            aria-label="Table column headers"
            data-testid="column-header"
        >
            {columns.map((column, idx) => {
                return (
                    <div
                        key={`${column}-${idx}`}
                        className="text-sm font-semibold text-[color:var(--color-text)] uppercase tracking-wide"
                        role="columnheader"
                        aria-sort="none"
                        data-testid={`column-${idx}`}
                    >
                        {column}
                    </div>
                );
            })}
        </header>
    );
};

export default ColumnHeaderComponent;