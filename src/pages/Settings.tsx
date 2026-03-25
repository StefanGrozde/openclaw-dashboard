import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Bell, Database, Shield, Cpu, Save } from 'lucide-react';
import ErrorBanner from '../components/ui/ErrorBanner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useSettings } from '../hooks/useSettings';
import type { SystemSettings } from '../types';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#1a2236] bg-[#0e1320]">
      <div className="flex items-center gap-2 border-b border-[#1a2236] px-5 py-4">
        <Icon size={15} className="text-blue-400" />
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-300">{label}</div>
        {description ? <div className="mt-0.5 text-xs text-gray-600">{description}</div> : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <div className="h-5 w-9 rounded-full bg-[#1a2236] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-4" />
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className={`w-60 rounded-md border border-[#1a2236] bg-[#080b12] px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600 focus:border-blue-700 focus:outline-none ${mono ? 'font-mono' : ''}`}
    />
  );
}

function Select({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-60 rounded-md border border-[#1a2236] bg-[#080b12] px-3 py-1.5 text-sm text-gray-300 focus:border-blue-700 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default function Settings() {
  const { data: settings, isLoading, error, saveSettings, isSaving, saveError } = useSettings();
  const [formValues, setFormValues] = useState<Partial<SystemSettings>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!saveSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [saveSuccess]);

  function updateField<K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) {
    setFormValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSave() {
    await saveSettings(formValues);
    setSaveSuccess(true);
    setFormValues({});
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="mt-0.5 text-sm text-gray-500">System configuration for the Openclaw platform</p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {saveError ? <ErrorBanner message={saveError} /> : null}

      <div className="max-w-3xl space-y-4">
        <Section title="System" icon={SettingsIcon}>
          <Field label="System Name" description="Display name for this Openclaw instance">
            <TextInput
              value={formValues.systemName ?? settings?.systemName ?? ''}
              onChange={(value) => updateField('systemName', value)}
            />
          </Field>
          <Field label="Default Agent Model" description="Model used for new agents unless overridden">
            <Select
              options={['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']}
              value={formValues.defaultModel ?? settings?.defaultModel ?? 'claude-sonnet-4-6'}
              onChange={(value) => updateField('defaultModel', value)}
            />
          </Field>
          <Field label="Max Concurrent Tasks" description="Maximum tasks that can run simultaneously">
            <TextInput
              value={String(formValues.maxConcurrentTasks ?? settings?.maxConcurrentTasks ?? '')}
              onChange={(value) => updateField('maxConcurrentTasks', Number(value))}
            />
          </Field>
          <Field label="Task Timeout (seconds)" description="Default timeout before a task is marked failed">
            <TextInput
              value={String(formValues.taskTimeoutSeconds ?? settings?.taskTimeoutSeconds ?? '')}
              onChange={(value) => updateField('taskTimeoutSeconds', Number(value))}
            />
          </Field>
        </Section>

        <Section title="Notifications" icon={Bell}>
          <Field label="Email Alerts" description="Send email on agent errors or task failures">
            <Toggle
              checked={formValues.emailAlertsEnabled ?? settings?.emailAlertsEnabled ?? false}
              onChange={(value) => updateField('emailAlertsEnabled', value)}
            />
          </Field>
          <Field label="Slack Webhook" description="Post critical alerts to a Slack channel">
            <Toggle
              checked={formValues.slackWebhookEnabled ?? settings?.slackWebhookEnabled ?? false}
              onChange={(value) => updateField('slackWebhookEnabled', value)}
            />
          </Field>
          <Field label="Alert on Task Failure" description="Trigger notification when any task fails">
            <Toggle
              checked={formValues.alertOnTaskFailure ?? settings?.alertOnTaskFailure ?? false}
              onChange={(value) => updateField('alertOnTaskFailure', value)}
            />
          </Field>
          <Field label="Alert on Agent Offline" description="Trigger when a monitored agent goes offline">
            <Toggle
              checked={formValues.alertOnAgentOffline ?? settings?.alertOnAgentOffline ?? false}
              onChange={(value) => updateField('alertOnAgentOffline', value)}
            />
          </Field>
        </Section>

        <Section title="Data & Storage" icon={Database}>
          <Field label="Log Retention (days)" description="How long to keep operation logs">
            <TextInput
              value={String(formValues.logRetentionDays ?? settings?.logRetentionDays ?? '')}
              onChange={(value) => updateField('logRetentionDays', Number(value))}
            />
          </Field>
          <Field label="Output Storage Path" description="Base path for agent output files">
            <TextInput
              value={formValues.outputStoragePath ?? settings?.outputStoragePath ?? ''}
              onChange={(value) => updateField('outputStoragePath', value)}
              mono
            />
          </Field>
          <Field label="Auto-purge Completed Tasks" description="Remove completed task records after retention period">
            <Toggle
              checked={formValues.autoPurgeCompleted ?? settings?.autoPurgeCompleted ?? false}
              onChange={(value) => updateField('autoPurgeCompleted', value)}
            />
          </Field>
        </Section>

        <Section title="Security" icon={Shield}>
          <Field label="Require Auth on API" description="Enforce authentication on gateway endpoints">
            <Toggle
              checked={formValues.requireAuth ?? settings?.requireAuth ?? false}
              onChange={(value) => updateField('requireAuth', value)}
            />
          </Field>
          <Field label="Audit Logging" description="Log all user actions and configuration changes">
            <Toggle
              checked={formValues.auditLogging ?? settings?.auditLogging ?? false}
              onChange={(value) => updateField('auditLogging', value)}
            />
          </Field>
          <Field label="Sandbox Agent Execution" description="Run agent tasks in isolated environments">
            <Toggle
              checked={formValues.sandboxExecution ?? settings?.sandboxExecution ?? false}
              onChange={(value) => updateField('sandboxExecution', value)}
            />
          </Field>
        </Section>

        <Section title="Performance" icon={Cpu}>
          <Field label="Agent Polling Interval (ms)" description="How often the UI refreshes agent status">
            <TextInput
              value={String(formValues.agentPollingInterval ?? settings?.agentPollingInterval ?? '')}
              onChange={(value) => updateField('agentPollingInterval', Number(value))}
            />
          </Field>
          <Field label="Max Tokens per Task" description="Token budget cap per individual task execution">
            <TextInput
              value={String(formValues.maxTokensPerTask ?? settings?.maxTokensPerTask ?? '')}
              onChange={(value) => updateField('maxTokensPerTask', Number(value))}
            />
          </Field>
        </Section>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => {
              void handleSave();
            }}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? <LoadingSpinner size="sm" /> : <Save size={14} />}
            {saveSuccess ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
