"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, ShieldAlert, UserRoundCheck, UserRoundCog, Users } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Alert, Badge, EmptyState, LoadingPanel } from "@/components/ui/Primitives";
import { useToast } from "@/components/ui/Toast";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { StaffMember } from "@/lib/types";

/** A self-registered specialist still waiting on a decision. */
const isPending = (member: StaffMember) =>
  member.role === "specialist" &&
  !member.active &&
  member.self_registered &&
  !member.approved_at;

export default function AdminStaffPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [members, setMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    api
      .get<StaffMember[]>("/admin/staff", true)
      .then(setMembers)
      .catch(() => setError("We couldn't load the staff directory. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const { pending, team } = useMemo(
    () => ({
      pending: members.filter(isPending),
      team: members.filter((member) => !isPending(member)),
    }),
    [members],
  );

  /** `action` returns the updated row, or null when the account was removed. */
  const run = async (
    id: string,
    action: () => Promise<StaffMember | null>,
    success: string,
  ) => {
    setBusyId(id);
    try {
      const updated = await action();
      setMembers((current) =>
        updated
          ? current.map((member) => (member.id === id ? updated : member))
          : current.filter((member) => member.id !== id),
      );
      toast.success(success);
    } catch (caught) {
      toast.error(
        "That didn't work",
        caught instanceof ApiError ? caught.message : "Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const approve = (member: StaffMember) =>
    run(
      member.id,
      () => api.post<StaffMember>(`/admin/staff/${member.id}/approve`, undefined, true),
      `${displayName(member)} can now sign in.`,
    );

  const revoke = (member: StaffMember) =>
    run(
      member.id,
      () => api.post<StaffMember>(`/admin/staff/${member.id}/revoke`, undefined, true),
      `Access revoked for ${displayName(member)}.`,
    );

  const decline = (member: StaffMember) =>
    run(
      member.id,
      () => api.del<void>(`/admin/staff/${member.id}`, true).then(() => null),
      `Request from ${displayName(member)} declined.`,
    );

  if (loading) return <LoadingPanel label="Loading staff…" />;
  if (error) return <Alert tone="error">{error}</Alert>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {!isAdmin ? (
        <Alert tone="info">
          Only administrators can approve, reactivate or deactivate staff accounts.
        </Alert>
      ) : null}

      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">
              Awaiting approval
            </h2>
            <p className="text-sm text-muted">
              Specialist accounts requested from the sign-up page
            </p>
          </div>
          {pending.length > 0 ? (
            <Badge tone="amber">{pending.length} pending</Badge>
          ) : null}
        </div>

        {pending.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<UserRoundCheck className="size-5" />}
            title="Nothing waiting"
            description="Specialist requests from the website appear here for approval."
          />
        ) : (
          <>
            <Alert tone="warning" className="mt-5">
              <strong className="font-semibold">Approve only people you recognise.</strong>{" "}
              A specialist account can read every client file, document and dispute.
            </Alert>
            <ul className="mt-4 space-y-3">
              {pending.map((member) => (
                <li
                  key={member.id}
                  className="rounded-xl border border-amber-200 bg-amber-50/40 p-5"
                >
                  <MemberIdentity member={member} />
                  {isAdmin ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        loading={busyId === member.id}
                        onClick={() => approve(member)}
                      >
                        Approve
                      </Button>
                      <ConfirmButton
                        label="Decline"
                        confirmLabel="Confirm decline"
                        disabled={busyId === member.id}
                        onConfirm={() => decline(member)}
                      />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="card-surface p-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">Team</h2>
            <p className="text-sm text-muted">Administrators and approved specialists</p>
          </div>
          <p className="text-sm text-muted">{team.length} total</p>
        </div>

        {team.length === 0 ? (
          <EmptyState
            className="mt-5"
            icon={<Users className="size-5" />}
            title="No staff accounts yet"
          />
        ) : (
          <ul className="mt-5 space-y-3">
            {team.map((member) => {
              const isSelf = member.id === user?.id;
              return (
                <li key={member.id} className="rounded-xl border border-navy-100 p-5">
                  <MemberIdentity member={member} isSelf={isSelf} />
                  {isAdmin && !isSelf ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {member.active ? (
                        <ConfirmButton
                          label="Deactivate"
                          confirmLabel="Confirm deactivate"
                          disabled={busyId === member.id}
                          onConfirm={() => revoke(member)}
                        />
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={busyId === member.id}
                          onClick={() => approve(member)}
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function displayName(member: StaffMember): string {
  return `${member.first_name} ${member.last_name}`.trim() || member.email;
}

function MemberIdentity({
  member,
  isSelf = false,
}: {
  member: StaffMember;
  isSelf?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-navy-900">
          {displayName(member)}
          {isSelf ? <span className="ml-2 text-xs font-medium text-muted">(you)</span> : null}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <a
            href={`mailto:${member.email}`}
            className="inline-flex items-center gap-1.5 transition hover:text-navy-800"
          >
            <Mail className="size-3.5" aria-hidden />
            {member.email}
          </a>
          {member.created_at ? (
            <span title={formatDateTime(member.created_at)}>
              Registered {formatRelative(member.created_at)}
            </span>
          ) : null}
          <span>
            {member.last_login_at
              ? `Last signed in ${formatRelative(member.last_login_at)}`
              : "Never signed in"}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
        <Badge tone={member.role === "admin" ? "violet" : "blue"}>
          {member.role === "admin" ? (
            <UserRoundCog className="size-3.5" aria-hidden />
          ) : (
            <UserRoundCheck className="size-3.5" aria-hidden />
          )}
          {member.role === "admin" ? "Administrator" : "Specialist"}
        </Badge>
        {member.active ? (
          <Badge tone="brand" dot>
            Active
          </Badge>
        ) : (
          <Badge tone="slate">
            <ShieldAlert className="size-3.5" aria-hidden />
            {member.approved_at ? "Deactivated" : "Pending"}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Two-step button for the actions that can't be undone from this screen —
 * declining deletes the request outright.
 */
function ConfirmButton({
  label,
  confirmLabel,
  disabled,
  onConfirm,
}: {
  label: string;
  confirmLabel: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <Button size="sm" variant="outline" disabled={disabled} onClick={() => setArmed(true)}>
        {label}
      </Button>
    );
  }
  return (
    <>
      <Button
        size="sm"
        variant="danger"
        disabled={disabled}
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setArmed(false)}>
        Cancel
      </Button>
    </>
  );
}
