'use client';

import { useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";

export default function OrderSubscription() {
  useEffect(() => {
    const supabase = createClient();
    
    const subscription = supabase
      .channel('trade-orders-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('🔔 New order placed:', payload.new);
        }
      )
      .subscribe();

    console.log('🎯 Subscribed to order changes');
    
    return () => {
      subscription.unsubscribe();
      console.log('🎯 Unsubscribed from order changes');
    };
  }, []);

  return null; // This component doesn't render anything
} 