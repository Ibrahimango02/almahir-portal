'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
    isConnected: boolean;
    connectionError: string | null;
    onReconnect: () => void;
    isLoading?: boolean;
}

export function ConnectionStatus({
    isConnected,
    connectionError,
    onReconnect,
    isLoading = false
}: ConnectionStatusProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Connecting...</span>
            </div>
        );
    }

    if (isConnected) {
        return (
            <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-500" />
                <Badge variant="secondary" className="text-xs">
                    Connected
                </Badge>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-500" />
            <Badge variant="destructive" className="text-xs">
                Disconnected
            </Badge>
            {connectionError && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3" />
                    {connectionError}
                </div>
            )}
            <Button
                size="sm"
                variant="outline"
                onClick={onReconnect}
                className="h-6 px-2 text-xs"
            >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reconnect
            </Button>
        </div>
    );
} 