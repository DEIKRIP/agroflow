"use client"

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Notification as NotificationType, BolivarDigitalClient } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const notificationIcons = {
    info: <Bell className="h-5 w-5 text-blue-500" />,
    warning: <Bell className="h-5 w-5 text-orange-500" />,
    success: <Bell className="h-5 w-5 text-green-500" />,
    action_required: <Bell className="h-5 w-5 text-indigo-500" />,
};

const notificationStyles = {
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    warning: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    action_required: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800',
};


const NotificationCard = ({ notification, clientName, setActiveTab }: { notification: NotificationType, clientName: string, setActiveTab: (tab: string) => void }) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleMarkAsRead = async () => {
        try {
            setIsUpdating(true);
            const { error } = await supabase
              .from('notifications')
              .update({ status: 'read', updatedAt: new Date().toISOString() })
              .eq('id', notification.id);
            if (error) throw error;
            // Optimistic UI update: mutate local status
            notification.status = 'read';
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || 'No se pudo marcar como leída', variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };
    
    

    return (
        <Card className={cn(notification.status === 'unread' ? 'bg-background' : 'bg-muted/50 dark:bg-muted/20', notificationStyles[notification.type])}>
            <CardContent className="p-4 flex items-start gap-4">
                <div className="pt-1">
                    {notificationIcons[notification.type]}
                </div>
                <div className="flex-grow">
                    <p className="text-sm text-foreground mb-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                        Sujeto: <span className="font-medium text-foreground/80">{clientName}</span> | {new Date(notification.createdAt).toLocaleString('es-VE')}
                    </p>
                </div>
                {notification.status === 'unread' && (
                     <Button variant="ghost" size="sm" onClick={handleMarkAsRead} disabled={isUpdating}>
                        Marcar como leída
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}


export default function NotificationsModule({ setActiveTab: _setActiveTab }: { setActiveTab: (tab: string) => void }) {
    const [notifications, setNotifications] = useState<NotificationType[]>([]);
    const [clients, setClients] = useState<Record<string, BolivarDigitalClient>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch clients
                const { data: clientsData, error: clientsError } = await supabase
                    .from('bolivarDigitalClients')
                    .select('*');

                if (clientsError) throw clientsError;

                const clientsMap = clientsData?.reduce((acc, client) => ({
                    ...acc,
                    [client.id]: client
                }), {} as Record<string, BolivarDigitalClient>) || {};
                
                setClients(clientsMap);

                // Fetch notifications
                const { data: notificationsData, error: notificationsError } = await supabase
                    .from('notifications')
                    .select('*')
                    .order('createdAt', { ascending: false });

                if (notificationsError) throw notificationsError;

                setNotifications(notificationsData || []);
                
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err instanceof Error ? err : new Error('Error al cargar las notificaciones'));
                toast({
                    title: 'Error',
                    description: 'No se pudieron cargar las notificaciones',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => n.status === 'unread').length;
    }, [notifications]);

    return (
        <div className="p-1 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-semibold text-foreground">Centro de Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded px-2 py-1 text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30">
                    {unreadCount} Sin Leer
                  </span>
                )}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                </div>
            ) : error ? (
                <p className="text-destructive">Error: {error.message}</p>
            ) : notifications.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium text-foreground">Bandeja de entrada vacía</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Las alertas y acciones requeridas aparecerán aquí.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notif => {
                        const clientName = clients[notif.clientId]?.fullName || "Sujeto no encontrado";
                        return (
                            <NotificationCard 
                                key={notif.id} 
                                notification={notif} 
                                clientName={clientName} 
                                setActiveTab={setActiveTab}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

    