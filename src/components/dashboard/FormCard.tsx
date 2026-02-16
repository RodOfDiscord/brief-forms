'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2, BarChart3, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { FormListItem } from '@/types/form';

interface FormCardProps {
    form: FormListItem;
    onDelete: (id: string) => void;
}

export function FormCard({ form, onDelete }: FormCardProps) {
    const publicUrl = `/forms/${form.slug}`;

    const copyLink = async () => {
        const link = window.location.origin + publicUrl;

        // Перевірка наявності Clipboard API
        if (!navigator.clipboard) {
            toast.error('Копіювання не підтримується вашим браузером');
            return;
        }

        try {
            await navigator.clipboard.writeText(link);
            toast.success('Посилання скопійовано до буферу обміну');
        } catch (error) {
            console.error('Помилка копіювання:', error);
            toast.error('Не вдалося скопіювати посилання');
        }
    };

    return (
        <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">/{form.slug}</p>
                </div>
                <Badge variant={form.is_published ? 'default' : 'secondary'}>
                    {form.is_published ? 'Опубліковано' : 'Чернетка'}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        {form.response_count} відповідей
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/forms/${form.id}`}>
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Редагувати
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/forms/${form.id}/responses`}>
                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                            Відповіді
                        </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={copyLink}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Посилання
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(form.id)}
                    >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Видалити
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}