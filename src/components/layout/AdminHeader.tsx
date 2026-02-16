'use client';

import { usePathname } from 'next/navigation';

const breadcrumbMap: Record<string, string> = {
    '/dashboard': 'Дашборд',
    '/dashboard/forms/new': 'Нова форма',
};

export function AdminHeader() {
    const pathname = usePathname();

    const getTitle = () => {
        if (breadcrumbMap[pathname]) return breadcrumbMap[pathname];
        if (pathname.includes('/responses')) return 'Відповіді';
        if (pathname.includes('/dashboard/forms/')) return 'Редагування форми';
        return 'Дашборд';
    };

    return (
        <header className="flex h-16 items-center border-b bg-card px-6">
            <h1 className="text-xl font-semibold">{getTitle()}</h1>
        </header>
    );
}
