import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function FormSuccessPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
                <CardHeader>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl">Дякуємо!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Вашу відповідь успішно надіслано. Дякуємо за ваш час!
                    </p>
                    <Link
                        href="/"
                        className="inline-block text-primary hover:underline text-sm"
                    >
                        Повернутися на головну
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
