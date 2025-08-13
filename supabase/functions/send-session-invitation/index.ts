import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SessionInvitationRequest {
  studentEmail: string;
  studentName: string;
  sessionTitle: string;
  teacherName: string;
  sessionSlug: string;
  sessionId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      studentEmail, 
      studentName, 
      sessionTitle, 
      teacherName, 
      sessionSlug,
      sessionId 
    }: SessionInvitationRequest = await req.json();

    console.log(`Sending session invitation to ${studentEmail} for session ${sessionTitle}`);

    const joinUrl = `${req.headers.get('origin')}/session/${sessionSlug}`;

    const emailResponse = await resend.emails.send({
      from: "Octopy Learning <noreply@octopy.ink>",
      to: [studentEmail],
      subject: `Join "${sessionTitle}" - Collaborative Whiteboard Session`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #1f2937; font-size: 28px; font-weight: bold; margin: 0;">Octopy Learning</h1>
              <p style="color: #6b7280; margin: 8px 0 0 0;">Collaborative Whiteboard Platform</p>
            </div>
            
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 16px 0;">You're Invited to Join a Session!</h2>
            
            <div style="background-color: #f3f4f6; border-radius: 6px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; color: #374151;"><strong>Session:</strong> ${sessionTitle}</p>
              <p style="margin: 0 0 8px 0; color: #374151;"><strong>Teacher:</strong> ${teacherName}</p>
              <p style="margin: 0; color: #374151;"><strong>Student:</strong> ${studentName}</p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin: 24px 0;">
              ${teacherName} has invited you to join "${sessionTitle}" on Octopy Learning. 
              Click the button below to join the collaborative whiteboard session.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${joinUrl}" 
                 style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">
                Join Session
              </a>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 32px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
                <strong>Direct link:</strong> <a href="${joinUrl}" style="color: #3b82f6;">${joinUrl}</a>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                If you have trouble with the button above, copy and paste the link into your browser.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This invitation was sent by ${teacherName} via Octopy Learning
              </p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-session-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);