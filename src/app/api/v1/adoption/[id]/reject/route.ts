import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from "@/app/supabase/supabase";
import { NextRequest } from "next/server";

export async function PUT(_request: NextRequest, context: unknown) {
    const params = await (context as { params?: { id: string } | Promise<{ id: string }> }).params;
    const pathId = Number(params?.id ?? NaN);
    console.log('pathId:', pathId);
    if (Number.isNaN(pathId)){
        return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
    }

    try {
        console.log('Rejecting adoption request with id:', pathId);
        
        // Get adoption details with pet and user info for notifications
        const { data: adoptionDetails, error: fetchError } = await supabase
            .from('adoption')
            .select(`
                id,
                user,
                pet,
                users!adoption_user_fkey(
                    id,
                    username,
                    email
                ),
                pets!adoption_pet_fkey(
                    id,
                    name,
                    type,
                    breed
                )
            `)
            .eq('id', pathId)
            .single();

        if (fetchError || !adoptionDetails) {
            return new Response(JSON.stringify({ error: 'Adoption not found' }), { status: 404 });
        }

        // Update adoption status
        const { data, error } = await supabase
            .from('adoption')
            .update({ status: 'REJECTED' })
            .eq('id', pathId)
            .select()
            .single();
            
        if (error) {
            return new Response(JSON.stringify({ error: 'Failed to reject adoption' }), { status: 500 });
        }

        // Send notifications to the adopter
        if (adoptionDetails.users?.id) {
            const petName = adoptionDetails.pets?.name || 'the pet';
            const breed = adoptionDetails.pets?.breed ? ` (${adoptionDetails.pets.breed})` : '';
            
            const notificationTitle = '❌ Adoption Application Update';
            const notificationMessage = `We regret to inform you that your adoption application for ${petName}${breed} has been declined. Please feel free to browse other available pets.`;

            try {
                // Send push notification
                await pushNotification(
                    adoptionDetails.users.id,
                    notificationTitle,
                    notificationMessage,
                    '/pets'
                );

                // Store in-app notification
                await storeNotification(
                    adoptionDetails.users.id,
                    notificationTitle,
                    notificationMessage
                );
            } catch (notificationError) {
                console.error('Failed to send rejection notification:', notificationError);
                // Don't fail the entire request if notification fails
            }
        }

        console.log('Adoption rejected and notification sent:', data);
        return new Response(JSON.stringify({ 
            message: `Adoption request with id ${pathId} rejected.`,
            data 
        }), { status: 200 });

    } catch (err) {
        console.error('Error rejecting adoption:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
