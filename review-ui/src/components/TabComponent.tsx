import React, { useState, ReactNode } from 'react';

interface TabItem {
    id: string;
    label: string;
    content: ReactNode;
    icon?: ReactNode;
    disabled?: boolean;
}

interface TabsProps {
    tabs: TabItem[];
    defaultTab?: string;
    variant?: 'default' | 'pills' | 'underline' | 'minimal';
    size?: 'sm' | 'md' | 'lg';
    orientation?: 'horizontal' | 'vertical';
    className?: string;
    onTabChange?: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
    tabs,
    defaultTab,
    variant = 'default',
    size = 'md',
    orientation = 'horizontal',
    className = '',
    onTabChange,
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    const activeTabItem = tabs.find((tab) => tab.id === activeTab);
    const activeContent = activeTabItem?.content;

    const handleTabClick = (tabId: string, disabled?: boolean) => {
        if (disabled) return;
        setActiveTab(tabId);
        onTabChange?.(tabId);
    };

    // Size variants
    const sizeClasses = {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
    };

    // Variant styles
    const getTabClasses = (tab: TabItem, isActive: boolean) => {
        const baseClasses = `
      cursor-pointer transition-all duration-200 font-medium
      ${sizeClasses[size]}
      ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
    `;

        const variants = {
            default: isActive
                ? 'bg-blue-500 text-white rounded-lg shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg',

            pills: isActive
                ? 'bg-blue-100 text-blue-700 rounded-full border border-blue-200'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-full border border-transparent',

            underline: isActive
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent hover:border-gray-300',

            minimal: isActive
                ? 'text-[color:var(--color-main)] bg-[color:var(--color-main-light)]'
                : 'text-[color:var(--color-text)] hover:text-[color:var(--color-gray)] hover:bg-[color:var(--color-light)]',
        };

        return `${baseClasses} ${variants[variant]}`;
    };

    const containerClasses = orientation === 'vertical' ? 'flex gap-6' : 'flex flex-col';
    const contentClasses = orientation === 'vertical' ? 'flex-1 pl-6 border-l border-gray-200' : 'min-h-[200px]';

    return (
        <div className={`w-full ${containerClasses} ${className}`}>

                {/* Tab row — vertical stack on mobile, horizontal row on sm+ */}
            <div
                className={
                    orientation === 'vertical'
                        ? 'flex flex-col gap-2 min-w-[200px]'
                        : 'flex flex-col lg:flex-row gap-2 border-b border-[color:var(--color-border)] mb-6'
                }
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabClick(tab.id, tab.disabled)}
                        className={`w-full lg:w-auto flex-shrink-0 whitespace-nowrap ${getTabClasses(tab, activeTab === tab.id)}`}
                        disabled={tab.disabled}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                    >
                        <div className="flex items-center gap-2">
                            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
                            <span>{tab.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div
                className={contentClasses}
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={activeTab}
            >
                <div className="animate-fadeIn">{activeContent}</div>
            </div>
        </div>
    );
};

export default Tabs;
