import { Settings as SettingsIcon, Key, Bell, Database, Shield, Cpu, Save } from 'lucide-react';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[#0e1320] border border-[#1a2236] rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#1a2236]">
        <Icon size={15} className="text-blue-400" />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-300 font-medium">{label}</div>
        {description && <div className="text-xs text-gray-600 mt-0.5">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ defaultChecked = false }: { defaultChecked?: boolean }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
      <div className="w-9 h-5 bg-[#1a2236] peer-checked:bg-blue-600 rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
    </label>
  );
}

function TextInput({ defaultValue, placeholder, mono = false }: { defaultValue?: string; placeholder?: string; mono?: boolean }) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={`bg-[#080b12] border border-[#1a2236] rounded-md px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-700 w-60 ${mono ? 'font-mono' : ''}`}
    />
  );
}

function Select({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
  return (
    <select
      defaultValue={defaultValue}
      className="bg-[#080b12] border border-[#1a2236] rounded-md px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-700 w-60"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function Settings() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">System configuration for the Openclaw platform</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <Section title="System" icon={SettingsIcon}>
          <Field label="System Name" description="Display name for this Openclaw instance">
            <TextInput defaultValue="Openclaw Production" />
          </Field>
          <Field label="Default Agent Model" description="Model used for new agents unless overridden">
            <Select options={['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']} defaultValue="claude-sonnet-4-6" />
          </Field>
          <Field label="Max Concurrent Tasks" description="Maximum tasks that can run simultaneously">
            <TextInput defaultValue="10" />
          </Field>
          <Field label="Task Timeout (seconds)" description="Default timeout before a task is marked failed">
            <TextInput defaultValue="3600" />
          </Field>
        </Section>

        <Section title="API Keys" icon={Key}>
          <Field label="Anthropic API Key" description="Used for all Claude model requests">
            <TextInput defaultValue="sk-ant-••••••••••••••••••••••" mono placeholder="sk-ant-..." />
          </Field>
          <Field label="Openclaw API Key" description="Key for external systems to call this instance">
            <TextInput defaultValue="oc-••••••••••••••••••••••" mono placeholder="oc-..." />
          </Field>
        </Section>

        <Section title="Notifications" icon={Bell}>
          <Field label="Email Alerts" description="Send email on agent errors or task failures">
            <Toggle defaultChecked />
          </Field>
          <Field label="Slack Webhook" description="Post critical alerts to a Slack channel">
            <Toggle />
          </Field>
          <Field label="Alert on Task Failure" description="Trigger notification when any task fails">
            <Toggle defaultChecked />
          </Field>
          <Field label="Alert on Agent Offline" description="Trigger when a monitored agent goes offline">
            <Toggle defaultChecked />
          </Field>
        </Section>

        <Section title="Data & Storage" icon={Database}>
          <Field label="Log Retention (days)" description="How long to keep operation logs">
            <TextInput defaultValue="90" />
          </Field>
          <Field label="Output Storage Path" description="Base path for agent output files">
            <TextInput defaultValue="/openclaw/data/outputs" mono />
          </Field>
          <Field label="Auto-purge Completed Tasks" description="Remove completed task records after retention period">
            <Toggle defaultChecked />
          </Field>
        </Section>

        <Section title="Security" icon={Shield}>
          <Field label="Require Auth on API" description="Enforce API key authentication on all endpoints">
            <Toggle defaultChecked />
          </Field>
          <Field label="Audit Logging" description="Log all user actions and configuration changes">
            <Toggle defaultChecked />
          </Field>
          <Field label="Sandbox Agent Execution" description="Run agent tasks in isolated environments">
            <Toggle />
          </Field>
        </Section>

        <Section title="Performance" icon={Cpu}>
          <Field label="Agent Polling Interval (ms)" description="How often the UI refreshes agent status">
            <TextInput defaultValue="5000" />
          </Field>
          <Field label="Max Tokens per Task" description="Token budget cap per individual task execution">
            <TextInput defaultValue="100000" />
          </Field>
        </Section>

        <div className="flex justify-end pt-2">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-colors">
            <Save size={14} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
