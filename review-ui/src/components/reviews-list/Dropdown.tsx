import { useEffect, useRef } from 'react';
import { DropdownProps } from '../../types/review.ts';
import { useState } from 'react';
import { FC } from 'react';

const Dropdown: FC<DropdownProps> = ({ trigger, children, position = 'left', width = '200px' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

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

    // After the nav renders, nudge it back into the viewport if it overflows either edge
    useEffect(() => {
        if (!isOpen || !navRef.current) return;
        const nav = navRef.current;
        nav.style.removeProperty('transform');
        const rect = nav.getBoundingClientRect();
        const margin = 16; // 1rem breathing room from each edge
        if (rect.left < margin) {
            // Overflows left edge — shift right
            nav.style.transform = `translateX(${margin - rect.left}px)`;
        } else if (rect.right > window.innerWidth - margin) {
            // Overflows right edge — shift left
            nav.style.transform = `translateX(-${rect.right - (window.innerWidth - margin)}px)`;
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
                    ref={navRef}
                    className={`absolute mt-1 bg-[color:var(--color-white)] border border-[color:var(--color-border)]
                    rounded shadow-lg z-50 ${
                        position === 'right' ? 'right-0' : 'left-0'
                    }`}
                    data-testid="dropdown-container"
                    style={{ width, maxWidth: 'calc(100vw - 2rem)' }}
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
