"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type React from "react";
import type { BolivarDigitalClient, Financiamiento } from "@/lib/types";
import { listActiveFinanciamientosWithClient, listPagosWithDetails, searchClientsWithActiveFinanciamientos } from "@/lib/bolivarDigitalActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, User, Briefcase, Calendar, HandCoins, PiggyBank, Search, CreditCard, Loader2, TrendingUp } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PaymentFormDialog from "./payment-form-dialog";

// No Firebase cache needed; Supabase helpers already provide needed data

const FinanciamientoActivoCard = ({ financiamiento }: { financiamiento: Financiamiento & { clientName?: string } }) => {
    const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
    
    return (
        <>
        <Card className="bg-muted/30">
            <CardHeader className="pb-2">
                 <CardTitle className="text-base flex items-center justify-between">
                    <span>{financiamiento.proposito}</span>
                     <Button size="sm" onClick={() => setIsPaymentFormOpen(true)}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pagar
                    </Button>
                </CardTitle>
                <CardDescription>Sujeto: {financiamiento.clientName || 'Cargando...'}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
                <div className="flex justify-between items-center">
                    <p>Monto: <span className="font-semibold">Bs. {(financiamiento.monto || 0).toLocaleString('es-VE')}</span></p>
                    <p>Pagado: <span className="font-semibold text-green-600">Bs. {(financiamiento.totalPagado || 0).toLocaleString('es-VE')}</span></p>
                    <span className="px-2 py-1 text-xs rounded border text-muted-foreground">{financiamiento.estado}</span>
                </div>
            </CardContent>
        </Card>
        <PaymentFormDialog
            isOpen={isPaymentFormOpen}
            setIsOpen={setIsPaymentFormOpen}
            financiamiento={financiamiento}
            clientName={financiamiento.clientName || ''}
        />
        </>
    )
}

const SearchResultCard = ({ client }: { client: BolivarDigitalClient & { financiamientos: Financiamiento[] } }) => {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary"/>
                    {client.fullName}
                </CardTitle>
                <CardDescription>Cédula: {client.cedula} | RIF: {client.rif}</CardDescription>
            </CardHeader>
            <CardContent>
                <h4 className="mb-2 font-medium text-sm text-muted-foreground">Financiamientos Activos</h4>
                <div className="space-y-2">
                    {client.financiamientos.length > 0 ? (
                        client.financiamientos.map(f => <FinanciamientoActivoCard key={f.id} financiamiento={{ ...f, clientName: client.fullName }} />)
                    ) : (
                        <p className="text-sm text-center text-muted-foreground py-4 bg-muted/20 rounded-md">No tiene financiamientos activos.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default function PaymentsModule() {
    const [pagosConDetalles, setPagosConDetalles] = useState<any[]>([]);
    const [financiamientosActivos, setFinanciamientosActivos] = useState<(Financiamiento & { clientName?: string })[]>([]);

    const [loadingFinanciamientos, setLoadingFinanciamientos] = useState(true);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<(BolivarDigitalClient & { financiamientos: Financiamiento[] })[]>([]);


    // Load active financings from Supabase
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingFinanciamientos(true);
            try {
                const data = await listActiveFinanciamientosWithClient();
                if (!cancelled) setFinanciamientosActivos(data as any);
            } catch (e) {
                console.error('Error loading active financiamientos', e);
            } finally {
                if (!cancelled) setLoadingFinanciamientos(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleSearch = useCallback(async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        setSearchResults([]);
        try {
            const results = await searchClientsWithActiveFinanciamientos(searchTerm);
            setSearchResults(results as any);
        } catch (error) {
            console.error("Error searching clients:", error);
        } finally {
            setIsSearching(false);
        }
    }, [searchTerm]);

    // Load payments history with details from Supabase
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setIsLoadingDetails(true);
            try {
                const pagos = await listPagosWithDetails();
                if (!cancelled) setPagosConDetalles(pagos as any);
            } catch (e) {
                console.error('Error loading pagos', e);
            } finally {
                if (!cancelled) setIsLoadingDetails(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const financialTotals = useMemo(() => {
        return pagosConDetalles.reduce((acc, pago) => {
            acc.totalIngresos += Number(pago.monto) || 0;
            acc.totalRetenido += Number(pago.montoRetenido) || 0;
            acc.totalGananciaProductores += Number(pago.gananciaAgricultor) || 0;
            return acc;
        }, { totalIngresos: 0, totalRetenido: 0, totalGananciaProductores: 0 });
    }, [pagosConDetalles]);

    const loadingTable = isLoadingDetails;

    return (
        <div className="h-full flex flex-col gap-8 p-1">
             <Card>
                <CardHeader>
                    <CardTitle>Financiamientos Activos</CardTitle>
                    <CardDescription>Lista de todos los créditos que están actualmente en ciclo de pago. Registre un nuevo pago directamente desde aquí.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {loadingFinanciamientos && <div className="flex justify-center items-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>}
                    {!loadingFinanciamientos && financiamientosActivos.length > 0 && (
                        financiamientosActivos.map(f => <FinanciamientoActivoCard key={f.id} financiamiento={f} />)
                    )}
                    {!loadingFinanciamientos && financiamientosActivos.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-4">No hay financiamientos activos en este momento.</p>
                    )}
                </CardContent>
            </Card>

            <Card className="flex-grow flex flex-col">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-foreground">Historial y KPIs Financieros</CardTitle>
                    <CardDescription>Registro centralizado de todos los abonos y análisis de la rentabilidad del modelo. También puede buscar un cliente para registrar un pago.</CardDescription>
                     <div className="grid gap-4 md:grid-cols-3 pt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Bs. {financialTotals.totalIngresos.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ganancia SiembraPaís (Retención)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-primary">Bs. {financialTotals.totalRetenido.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ganancia Productores</CardTitle>
                                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">Bs. {financialTotals.totalGananciaProductores.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</div>
                            </CardContent>
                        </Card>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col gap-4">
                     <div>
                        <div className="relative flex-grow">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Buscar cliente por nombre o cédula para registrar pago..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                         {isSearching && <div className="flex justify-center items-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary"/></div>}
                         {!isSearching && searchResults.length > 0 && (
                            <div className="space-y-4 mt-4 border-t pt-4">
                                {searchResults.map(client => <SearchResultCard key={client.id} client={client}/>)}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-auto">
                        {loadingTable && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
                        {!loadingTable && pagosConDetalles.length === 0 && (
                            <div className="text-center py-16 border-2 border-dashed rounded-lg h-full flex flex-col justify-center">
                                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-medium text-foreground">No se han registrado pagos</h3>
                                <p className="mt-1 text-sm text-muted-foreground">El historial de pagos aparecerá aquí.</p>
                            </div>
                        )}
                        {!loadingTable && pagosConDetalles.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-muted">
                                        <tr>
                                            <th className="text-left py-2"><User className="inline mr-1" />Sujeto</th>
                                            <th className="text-left py-2"><Calendar className="inline mr-1" />Fecha</th>
                                            <th className="text-right py-2"><DollarSign className="inline mr-1" />Monto Total</th>
                                            <th className="text-right py-2"><TrendingUp className="inline mr-1" />Monto Retenido</th>
                                            <th className="text-right py-2"><PiggyBank className="inline mr-1" />Ganancia Productor</th>
                                            <th className="text-left py-2">Método</th>
                                            <th className="text-left py-2"><Briefcase className="inline mr-1" />Crédito Asociado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagosConDetalles.map(pago => (
                                            <tr key={pago.id} className="border-t">
                                                <td className="py-2 font-medium">{pago.clientName}</td>
                                                <td className="py-2">{new Date(pago.fecha).toLocaleDateString()}</td>
                                                <td className="py-2 text-right font-semibold text-foreground">Bs. {Number(pago.monto || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-2 text-right text-primary font-medium">Bs. {Number(pago.montoRetenido || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-2 text-right text-green-600 font-medium">Bs. {Number(pago.gananciaAgricultor || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                                                <td className="py-2"><span className="inline-block px-2 py-1 rounded bg-muted capitalize">{pago.metodo}</span></td>
                                                <td className="py-2 text-muted-foreground text-xs">{pago.proposito}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
