import { CampaignsClient } from "@/components/campaigns-client"
import { listCampaigns } from "@/app/actions/campaigns"

export default async function CampaignsPage() {
    const campaigns = await listCampaigns()
    return <CampaignsClient campaigns={campaigns.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt,
        updatedAt: campaign.updatedAt,
        recipientCount: campaign.rows.length,
    }))} />
}
