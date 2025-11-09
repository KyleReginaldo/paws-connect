import { pushNotification, storeNotification } from '@/app/api/helper';
import { supabase } from "@/app/supabase/supabase";
import { AdoptionMailerDto } from '@/common/common.dto';
import { adoptionMailerBody } from '@/common/string';
import axios from 'axios';
import { NextRequest } from "next/server";

export async function PUT(_request: NextRequest, context: unknown) {
    const params = await (context as { params?: { id: string } | Promise<{ id: string }> }).params;
    const pathId = Number(params?.id ?? NaN);
    console.log('pathId:', pathId);
    if (Number.isNaN(pathId)){
        return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
    }

    try {
        console.log('Approving adoption request with id:', pathId);
        
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
                    email,
                    phone_number,
                    user_identification(
                        first_name,
                        last_name,
                        middle_initial,
                        address
                    )
                ),
                pets!adoption_pet_fkey(
                    id,
                    name,
                    type,
                    breed,
                    age,
                    size,
                    gender,
                    photos
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
            .update({ status: 'APPROVED' })
            .eq('id', pathId)
            .select()
            .single();
            
        if (error) {
            return new Response(JSON.stringify({ error: 'Failed to approve adoption' }), { status: 500 });
        }

        // Send notifications to the adopter
        if (adoptionDetails.users?.id) {
            const petName = adoptionDetails.pets?.name || 'the pet';
            const breed = adoptionDetails.pets?.breed ? ` (${adoptionDetails.pets.breed})` : '';
            
            const notificationTitle = '🎉 Adoption Approved!';
            const notificationMessage = `Congratulations! Your adoption application for ${petName}${breed} has been approved. Please contact us to arrange pickup.`;

            try {
                // Get the real name from user identification
                const userIdent = adoptionDetails.users?.user_identification;
                const realName = userIdent?.first_name && userIdent?.last_name
                    ? `${userIdent.first_name} ${userIdent.middle_initial ? userIdent.middle_initial + ' ' : ''}${userIdent.last_name}`
                    : adoptionDetails.users.username || 'No name';

                // Send push notification
                await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/send-email`, {
                to: adoptionDetails.users.email,
                subject: 'Your Adoption request has been Approved! 🎉',
                text: adoptionMailerBody(new AdoptionMailerDto(realName, adoptionDetails.pets?.name??'No name', adoptionDetails.pets?.breed??'Unkown breed', adoptionDetails.pets?.age?.toString()??'', adoptionDetails.pets?.size??'Unknown size', adoptionDetails.pets?.gender??"Unkown gender", adoptionDetails.pets?.photos![0] ??"")),
                });
                await pushNotification(
                    adoptionDetails.users.id,
                    notificationTitle,
                    notificationMessage,
                    `/adoption/${pathId}`
                );

                // Store in-app notification
                await storeNotification(
                    adoptionDetails.users.id,
                    notificationTitle,
                    notificationMessage
                );
            } catch (notificationError) {
                console.error('Failed to send approval notification:', notificationError);
                // Don't fail the entire request if notification fails
            }
        }

        console.log('Adoption approved and notification sent:', data);
        return new Response(JSON.stringify({ 
            message: `Adoption request with id ${pathId} approved.`,
            data 
        }), { status: 200 });

    } catch (err) {
        console.error('Error approving adoption:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
    }
}
