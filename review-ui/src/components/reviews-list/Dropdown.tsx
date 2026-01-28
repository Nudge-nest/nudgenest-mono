import { useEffect, useRef } from 'react';
import { DropdownProps } from '../../types/review.ts';
import { useState } from 'react';
import { FC } from 'react';

const Dropdown: FC<DropdownProps> = ({ trigger, children, position = 'left', width = '200px' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
            return () => {
                document.removeEventListener('click', handleClickOutside);
                document.removeEventListener('keydown', handleEscapeKey);
            };
        }
    }, [isOpen]);

    return (
        <div
            className="relative inline-block"
            data-testid="dropdown-wrapper"
            ref={dropdownRef}
        >
            <div
                data-testid="dropdown-trigger-wrapper"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                role="button"
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls="dropdown-menu"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    }
                }}
            >
                {trigger}
            </div>
            {isOpen && (
                <nav
                    id="dropdown-menu"
                    className={`absolute mt-1 bg-[color:var(--color-white)] border border-[color:var(--color-border)] 
                    rounded shadow-lg z-50 ${
                        position === 'right' ? 'right-0' : 'left-0'
                    }`}
                    data-testid="dropdown-container"
                    style={{ width }}
                    onClick={(e) => e.stopPropagation()}
                    role="menu"
                    aria-orientation="vertical"
                    tabIndex={-1}
                >
                    {children}
                </nav>
            )}
        </div>
    );
};

export default Dropdown;