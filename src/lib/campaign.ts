export const CAMPAIGN_LIMIT = 100
export const VARIABLE_PATTERN = /{{\s*([a-zA-Z0-9_]+)\s*}}/g

export function campaignRecipient(data: Record<string, string>, columns: { variableKey: string; displayName: string }[]) {
    const emailColumn = columns.find(column => column.variableKey === "email" || column.displayName.trim().toLowerCase() === "email")
    const email = data[emailColumn?.variableKey || "email"]?.trim()
    if (!email) return ""
    const directName = data.full_name?.trim() || data.name?.trim()
    const name = (directName || [data.first_name?.trim(), data.last_name?.trim()].filter(Boolean).join(" "))
        .replace(/\s+/g, " ")
        .trim()
    return name ? `"${name.replace(/"/g, "")}" <${email}>` : email
}

export function variableKey(displayName: string, used: Set<string> = new Set()) {
    const base = displayName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field"
    let key = base
    let suffix = 2
    while (used.has(key)) key = `${base}_${suffix++}`
    return key
}

export function renderCampaignTemplate(template: string, data: Record<string, string>) {
    return template.replace(VARIABLE_PATTERN, (_, key: string) => data[key] ?? "")
}

export function templateVariables(...templates: string[]) {
    const keys = new Set<string>()
    for (const template of templates) {
        for (const match of template.matchAll(VARIABLE_PATTERN)) keys.add(match[1])
    }
    return [...keys]
}

export function validateCampaign(input: {
    rows: { data: Record<string, string> }[]
    columns: { variableKey: string; displayName: string }[]
    subject: string
    html: string
}) {
    const errors: string[] = []
    const emailColumn = input.columns.find(c => c.variableKey === "email" || c.displayName.toLowerCase() === "email")
    if (!emailColumn) errors.push("Add a column named Email before sending.")
    if (input.rows.length === 0) errors.push("Add at least one recipient.")
    if (input.rows.length > CAMPAIGN_LIMIT) errors.push(`A campaign can contain a maximum of ${CAMPAIGN_LIMIT} recipients.`)
    if (!input.subject.trim()) errors.push("Add a subject.")
    if (!input.html.replace(/<[^>]*>/g, "").trim()) errors.push("Add email content.")
    const recipients = new Set<string>()
    input.rows.forEach((row, index) => {
        const email = row.data[emailColumn?.variableKey || "email"]?.trim()
        if (!email) errors.push(`Row ${index + 1} is missing an email address.`)
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push(`Row ${index + 1} has an invalid email address.`)
        else if (recipients.has(email.toLowerCase())) errors.push(`Row ${index + 1} duplicates ${email}.`)
        else recipients.add(email.toLowerCase())
        for (const key of templateVariables(input.subject, input.html)) {
            if (!row.data[key]?.trim()) errors.push(`Row ${index + 1} is missing ${key}.`)
        }
    })
    return { valid: errors.length === 0, errors }
}
