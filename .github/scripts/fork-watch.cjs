// Fork watch checks, run by .github/workflows/fork-watch.yml through actions/github-script.
// Each check opens an issue when something needs attention (GitHub emails the owner about
// issues the workflow opens) and closes it when the condition clears. See FORK.md, "Alerts".
'use strict'

const fs = require('fs')

const UPSTREAM = { owner: 'mainsail-crew', repo: 'mainsail' }
const HEALTH_ENVIRONMENT = 'jerrypi-health'
const CHANNELS = ['production', 'staging']
const HEARTBEAT_MAX_AGE_HOURS = 26
const HOUR_MS = 60 * 60 * 1000
const LABELS = {
    'upstream-sync': { color: '0e8a16', description: 'A new upstream Mainsail release to merge' },
    'updater-alert': { color: 'b60205', description: "jerrypi's updater needs attention" },
}

// --- shared -----------------------------------------------------------------------------

function parseVersion(text) {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(text || '').trim())
    return match ? match.slice(1).map(Number) : null
}

function isNewer(candidate, current) {
    const a = parseVersion(candidate)
    const b = parseVersion(current)
    if (!a || !b) return false
    for (let i = 0; i < 3; i++) {
        if (a[i] !== b[i]) return a[i] > b[i]
    }
    return false
}

async function ensureLabel(github, repo, name) {
    try {
        await github.rest.issues.getLabel({ ...repo, name })
    } catch (error) {
        if (error.status !== 404) throw error
        await github.rest.issues.createLabel({ ...repo, name, ...LABELS[name] })
    }
}

async function openIssues(github, repo, label) {
    const issues = await github.paginate(github.rest.issues.listForRepo, {
        ...repo,
        labels: label,
        state: 'open',
        per_page: 100,
    })
    return issues.filter((issue) => !issue.pull_request)
}

async function closeIssue(github, repo, issue, comment) {
    await github.rest.issues.createComment({ ...repo, issue_number: issue.number, body: comment })
    await github.rest.issues.update({
        ...repo,
        issue_number: issue.number,
        state: 'closed',
        state_reason: 'completed',
    })
}

// --- upstream release -------------------------------------------------------------------

// The "Upstream releases" section of FORK.md, with <tag> filled in.
function mergeSteps(forkDoc, tag) {
    const match = /^## Upstream releases\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(forkDoc)
    const steps = match ? match[1].trim() : 'See "Upstream releases" in FORK.md.'
    return steps.replaceAll('<tag>', tag)
}

function upstreamTitle(tag) {
    return `Upstream Mainsail ${tag} is out`
}

function upstreamBody(tag, current, url, forkDoc) {
    return [
        `Mainsail ${tag} is out upstream (${url}); this fork's \`package.json\` is at ${current}.`,
        '',
        'Merge it (from FORK.md, "Upstream releases"):',
        '',
        mergeSteps(forkDoc, tag),
        '',
        'Fork watch opened this issue and closes it once `package.json` on the default branch reaches the release.',
    ].join('\n')
}

async function checkUpstream({ github, context, core, root = '.' }) {
    const repo = context.repo
    const current = JSON.parse(fs.readFileSync(`${root}/package.json`, 'utf8')).version
    const forkDoc = fs.readFileSync(`${root}/FORK.md`, 'utf8')
    const { data: latest } = await github.rest.repos.getLatestRelease(UPSTREAM)
    const tag = latest.tag_name
    const open = await openIssues(github, repo, 'upstream-sync')

    for (const issue of open) {
        const issueTag = /^Upstream Mainsail (\S+) is out$/.exec(issue.title)?.[1]
        if (issueTag && !isNewer(issueTag, current)) {
            await closeIssue(github, repo, issue, `\`package.json\` is at ${current} now; closing.`)
            core.info(`closed #${issue.number}: ${issue.title}`)
        }
    }
    if (!isNewer(tag, current)) {
        core.info(`upstream ${tag}, fork ${current}: up to date`)
        return
    }
    const title = upstreamTitle(tag)
    const existing = open.find((issue) => issue.title === title)
    if (existing) {
        core.info(`upstream ${tag} is newer than ${current}; #${existing.number} is already open`)
        return
    }
    await ensureLabel(github, repo, 'upstream-sync')
    const { data: issue } = await github.rest.issues.create({
        ...repo,
        title,
        labels: ['upstream-sync'],
        body: upstreamBody(tag, current, latest.html_url, forkDoc),
    })
    core.notice(`opened #${issue.number}: ${title}`)
}

// --- updater heartbeat ------------------------------------------------------------------

function payloadOf(deployment) {
    if (typeof deployment.payload !== 'string') return deployment.payload || {}
    try {
        return JSON.parse(deployment.payload)
    } catch {
        return {}
    }
}

// The newest heartbeat time per channel (a Date), or undefined where there is none.
async function lastHeartbeats(github, repo) {
    const deployments = await github.paginate(github.rest.repos.listDeployments, {
        ...repo,
        environment: HEALTH_ENVIRONMENT,
        per_page: 100,
    })
    const last = {}
    for (const deployment of deployments) {
        const payload = payloadOf(deployment)
        if (payload.kind !== 'heartbeat' || !CHANNELS.includes(payload.channel)) continue
        const statuses = await github.paginate(github.rest.repos.listDeploymentStatuses, {
            ...repo,
            deployment_id: deployment.id,
            per_page: 100,
        })
        for (const status of statuses) {
            if (status.state !== 'success') continue
            const at = new Date(status.created_at)
            if (!last[payload.channel] || at > last[payload.channel]) last[payload.channel] = at
        }
    }
    return last
}

function heartbeatTitle(channel) {
    return `Updater heartbeat missing: ${channel}`
}

function heartbeatBody(channel, last) {
    const seen = last ? `The last heartbeat was at ${last.toISOString()}.` : 'There is no heartbeat on record.'
    return [
        `jerrypi's \`mainsail-updater@${channel}\` posts a heartbeat to the \`${HEALTH_ENVIRONMENT}\` environment once a day. ${seen} After ${HEARTBEAT_MAX_AGE_HOURS} hours without one, the updater is probably not running or not reaching GitHub: the Pi is down or offline, the timer has stopped, or the token was rejected or expired.`,
        '',
        'Check, on the tailnet:',
        '',
        '```',
        `ssh jerrypi systemctl list-timers 'mainsail-updater@*'`,
        `ssh jerrypi journalctl -u mainsail-updater@${channel} -n 50 -o cat`,
        '```',
        '',
        "A rejected token logs `event=github.rejected`; install a new one with the updater's install script (`--token-file`). Fork watch closes this issue when heartbeats resume.",
    ].join('\n')
}

async function checkHeartbeats({ github, context, core, now = new Date() }) {
    const repo = context.repo
    const last = await lastHeartbeats(github, repo)
    const open = await openIssues(github, repo, 'updater-alert')
    for (const channel of CHANNELS) {
        const title = heartbeatTitle(channel)
        const existing = open.find((issue) => issue.title === title)
        const at = last[channel]
        const stale = !at || now - at > HEARTBEAT_MAX_AGE_HOURS * HOUR_MS
        core.info(`${channel}: last heartbeat ${at ? at.toISOString() : 'never'}${stale ? ' (stale)' : ''}`)
        if (stale && !existing) {
            await ensureLabel(github, repo, 'updater-alert')
            const { data: issue } = await github.rest.issues.create({
                ...repo,
                title,
                labels: ['updater-alert'],
                body: heartbeatBody(channel, at),
            })
            core.warning(`opened #${issue.number}: ${title}`)
        } else if (!stale && existing) {
            await closeIssue(github, repo, existing, `Heartbeats resumed: the last was at ${at.toISOString()}.`)
            core.notice(`closed #${existing.number}: ${title}`)
        }
    }
}

module.exports = { checkUpstream, checkHeartbeats, isNewer, mergeSteps, HEARTBEAT_MAX_AGE_HOURS }
