"use client";

import {
    ArrowLeft,
    Boxes,
    CheckCircle2,
    MapPin,
    Package,
    Plus,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type Allocation = {
  id: string;
  quantity: number;
  notes: string | null;
  function: {
    id: string;
    name: string;
  };
};

type Resource = {
  id: string;
  eventId: string;
  name: string;
  type: string;
  quantity: number;
  status: string;
  location: string | null;
  notes: string | null;
  allocations: Allocation[];
};

type EventFunction = {
  id: string;
  name: string;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function ResourcesPage({
  params,
}: PageProps) {
  const [eventId, setEventId] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [functions, setFunctions] = useState<EventFunction[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] =
    useState(false);

  const [selectedResource, setSelectedResource] =
    useState<Resource | null>(null);

  const [resourceForm, setResourceForm] = useState({
    name: "",
    type: "EQUIPMENT",
    quantity: "1",
    status: "AVAILABLE",
    location: "",
    notes: "",
  });

  const [allocationForm, setAllocationForm] = useState({
    functionId: "",
    quantity: "1",
    notes: "",
  });

  useEffect(() => {
    params.then(({ id }) => {
      setEventId(id);
      loadData(id);
    });
  }, [params]);

  async function loadData(id: string) {
    try {
      setLoading(true);

      const [resourceResponse, functionResponse] =
        await Promise.all([
          fetch(`/api/events/${id}/resources`),
          fetch(`/api/events/${id}/functions`),
        ]);

      if (!resourceResponse.ok) {
        throw new Error("Failed to load resources");
      }

      if (!functionResponse.ok) {
        throw new Error("Failed to load functions");
      }

      const resourceData =
        await resourceResponse.json();

      const functionData =
        await functionResponse.json();

      setResources(resourceData);
      setFunctions(functionData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function createResource() {
    if (!resourceForm.name.trim()) {
      alert("Please enter a resource name.");
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/resources`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: resourceForm.name,
            type: resourceForm.type,
            quantity: Number(resourceForm.quantity),
            status: resourceForm.status,
            location: resourceForm.location,
            notes: resourceForm.notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create resource");
      }

      setShowModal(false);

      setResourceForm({
        name: "",
        type: "EQUIPMENT",
        quantity: "1",
        status: "AVAILABLE",
        location: "",
        notes: "",
      });

      await loadData(eventId);
    } catch (error) {
      console.error(error);
      alert("Could not create resource.");
    }
  }

  async function allocateResource() {
    if (!selectedResource) return;

    if (!allocationForm.functionId) {
      alert("Please select a function.");
      return;
    }

    try {
      const response = await fetch(
        `/api/events/${eventId}/resources/allocate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resourceId: selectedResource.id,
            functionId: allocationForm.functionId,
            quantity: Number(
              allocationForm.quantity
            ),
            notes: allocationForm.notes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not allocate resource.");
        return;
      }

      setShowAllocateModal(false);
      setSelectedResource(null);

      setAllocationForm({
        functionId: "",
        quantity: "1",
        notes: "",
      });

      await loadData(eventId);
    } catch (error) {
      console.error(error);
      alert("Could not allocate resource.");
    }
  }

  function getAllocatedQuantity(
    resource: Resource
  ) {
    return resource.allocations.reduce(
      (total, allocation) =>
        total + allocation.quantity,
      0
    );
  }

  function getAvailableQuantity(
    resource: Resource
  ) {
    return (
      resource.quantity -
      getAllocatedQuantity(resource)
    );
  }

  const totalResources = resources.length;

  const totalUnits = resources.reduce(
    (total, resource) =>
      total + resource.quantity,
    0
  );

  const allocatedUnits = resources.reduce(
    (total, resource) =>
      total + getAllocatedQuantity(resource),
    0
  );

  const availableUnits =
    totalUnits - allocatedUnits;

  return (
    <main className="mx-auto max-w-[1400px] p-5 sm:p-6 lg:p-8">

      {/* Back */}
      <Link
        href={`/events/${eventId}`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Back to Event
      </Link>

      {/* Header */}
      <section className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

        <div>

          <div className="flex items-center gap-3">

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Resources
            </h1>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {totalResources}
            </span>

          </div>

          <p className="mt-2 text-sm text-slate-500">
            Manage equipment, staff and other resources
            required for this event.
          </p>

        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <Plus size={17} />
          Add Resource
        </button>

      </section>

      {/* Summary */}
      <section className="mt-7 grid gap-4 sm:grid-cols-4">

        <SummaryCard
          label="Resource Types"
          value={totalResources}
          icon={Package}
        />

        <SummaryCard
          label="Total Units"
          value={totalUnits}
          icon={Boxes}
        />

        <SummaryCard
          label="Allocated"
          value={allocatedUnits}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Available"
          value={availableUnits}
          icon={Sparkles}
        />

      </section>

      {/* Content */}
      <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">

        {/* Resource list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 p-5 sm:p-6">

            <h2 className="text-base font-bold text-slate-900">
              Event Resources
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Resources available and allocated for this
              event.
            </p>

          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-400">
              Loading resources...
            </div>
          ) : resources.length === 0 ? (
            <EmptyState
              onAdd={() => setShowModal(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100">

              {resources.map((resource) => {

                const allocated =
                  getAllocatedQuantity(resource);

                const available =
                  getAvailableQuantity(resource);

                return (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    allocated={allocated}
                    available={available}
                    onAllocate={() => {
                      setSelectedResource(resource);
                      setShowAllocateModal(true);
                    }}
                  />
                );
              })}

            </div>
          )}

        </div>

        {/* AI */}
        <aside>

          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Sparkles size={17} />
              </div>

              <div>

                <h2 className="text-sm font-bold text-slate-900">
                  AI Resource Insight
                </h2>

                <p className="mt-1 text-xs text-violet-500">
                  VenueOps intelligence
                </p>

              </div>

            </div>

            <div className="mt-5 rounded-xl border border-violet-100 bg-white p-4">

              {resources.length === 0 ? (
                <p className="text-sm leading-5 text-slate-500">
                  Add event resources and VenueOps will
                  eventually identify allocation gaps,
                  shortages and resource conflicts.
                </p>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  There are{" "}
                  <strong>{totalUnits}</strong> resource
                  units tracked for this event, with{" "}
                  <strong>{allocatedUnits}</strong>{" "}
                  currently allocated.
                </p>
              )}

            </div>

            <button
              disabled={resources.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Sparkles size={14} />
              Analyze Resources
            </button>

          </div>

        </aside>

      </section>

      {/* Add Resource Modal */}
      {showModal && (
        <Modal
          title="Add Resource"
          description="Add equipment, staff or another resource."
          onClose={() => setShowModal(false)}
        >

          <div className="space-y-4">

            <Field
              label="Resource Name"
              value={resourceForm.name}
              onChange={(value) =>
                setResourceForm({
                  ...resourceForm,
                  name: value,
                })
              }
              placeholder="e.g. Wireless Microphone"
            />

            <div className="grid gap-4 sm:grid-cols-2">

              <SelectField
                label="Type"
                value={resourceForm.type}
                onChange={(value) =>
                  setResourceForm({
                    ...resourceForm,
                    type: value,
                  })
                }
                options={[
                  ["EQUIPMENT", "Equipment"],
                  ["STAFF", "Staff"],
                  ["SPACE", "Space"],
                  ["OTHER", "Other"],
                ]}
              />

              <Field
                label="Quantity"
                type="number"
                value={resourceForm.quantity}
                onChange={(value) =>
                  setResourceForm({
                    ...resourceForm,
                    quantity: value,
                  })
                }
              />

            </div>

            <SelectField
              label="Status"
              value={resourceForm.status}
              onChange={(value) =>
                setResourceForm({
                  ...resourceForm,
                  status: value,
                })
              }
              options={[
                ["AVAILABLE", "Available"],
                ["RESERVED", "Reserved"],
                ["UNAVAILABLE", "Unavailable"],
              ]}
            />

            <Field
              label="Location"
              value={resourceForm.location}
              onChange={(value) =>
                setResourceForm({
                  ...resourceForm,
                  location: value,
                })
              }
              placeholder="e.g. Pavilion 1 - Main Hall"
            />

            <Field
              label="Notes"
              value={resourceForm.notes}
              onChange={(value) =>
                setResourceForm({
                  ...resourceForm,
                  notes: value,
                })
              }
              placeholder="Additional information..."
            />

          </div>

          <ModalActions
            onCancel={() => setShowModal(false)}
            onSubmit={createResource}
            submitLabel="Create Resource"
          />

        </Modal>
      )}

      {/* Allocate Resource Modal */}
      {showAllocateModal &&
        selectedResource && (
          <Modal
            title="Allocate Resource"
            description={`Allocate ${selectedResource.name} to a function.`}
            onClose={() => {
              setShowAllocateModal(false);
              setSelectedResource(null);
            }}
          >

            <div className="mb-5 rounded-xl bg-slate-50 p-4">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-xs text-slate-400">
                    Available
                  </p>

                  <p className="mt-1 text-lg font-bold text-slate-900">
                    {getAvailableQuantity(
                      selectedResource
                    )}{" "}
                    units
                  </p>
                </div>

                <Package
                  size={22}
                  className="text-slate-400"
                />

              </div>

            </div>

            <div className="space-y-4">

              <SelectField
                label="Function"
                value={allocationForm.functionId}
                onChange={(value) =>
                  setAllocationForm({
                    ...allocationForm,
                    functionId: value,
                  })
                }
                options={[
                  ["", "Select a function"],
                  ...functions.map((item) => [
                    item.id,
                    item.name,
                  ]),
                ]}
              />

              <Field
                label="Quantity"
                type="number"
                value={allocationForm.quantity}
                onChange={(value) =>
                  setAllocationForm({
                    ...allocationForm,
                    quantity: value,
                  })
                }
              />

              <Field
                label="Notes"
                value={allocationForm.notes}
                onChange={(value) =>
                  setAllocationForm({
                    ...allocationForm,
                    notes: value,
                  })
                }
                placeholder="Allocation notes..."
              />

            </div>

            <ModalActions
              onCancel={() => {
                setShowAllocateModal(false);
                setSelectedResource(null);
              }}
              onSubmit={allocateResource}
              submitLabel="Allocate Resource"
            />

          </Modal>
        )}

    </main>
  );
}

/* -------------------------------- */
/* Resource Row */
/* -------------------------------- */

function ResourceRow({
  resource,
  allocated,
  available,
  onAllocate,
}: {
  resource: Resource;
  allocated: number;
  available: number;
  onAllocate: () => void;
}) {
  return (
    <div className="p-5 transition hover:bg-slate-50/60 sm:p-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Package size={19} />
        </div>

        <div className="min-w-0 flex-1">

          <div className="flex flex-col justify-between gap-3 sm:flex-row">

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="text-sm font-bold text-slate-900">
                  {resource.name}
                </h3>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                  {resource.type}
                </span>

              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">

                {resource.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    {resource.location}
                  </span>
                )}

                <span className="flex items-center gap-1.5">
                  <Boxes size={13} />
                  {resource.quantity} total
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} />
                  {allocated} allocated
                </span>

              </div>

            </div>

            <StatusBadge
              status={resource.status}
            />

          </div>

          {/* Quantity bar */}
          <div className="mt-4">

            <div className="mb-1.5 flex justify-between text-[11px]">

              <span className="text-slate-400">
                Allocation
              </span>

              <span className="font-semibold text-slate-600">
                {available} available
              </span>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">

              <div
                className="h-full rounded-full bg-slate-900 transition-all"
                style={{
                  width: `${
                    resource.quantity > 0
                      ? Math.min(
                          100,
                          (allocated /
                            resource.quantity) *
                            100
                        )
                      : 0
                  }%`,
                }}
              />

            </div>

          </div>

          {/* Allocations */}
          {resource.allocations.length > 0 && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3">

              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Allocated To
              </p>

              <div className="flex flex-wrap gap-2">

                {resource.allocations.map(
                  (allocation) => (
                    <span
                      key={allocation.id}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
                    >
                      {allocation.function.name} ×{" "}
                      {allocation.quantity}
                    </span>
                  )
                )}

              </div>

            </div>
          )}

          <button
            onClick={onAllocate}
            disabled={available <= 0}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
            Allocate
          </button>

        </div>

      </div>

    </div>
  );
}

/* -------------------------------- */
/* Shared UI */
/* -------------------------------- */

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-xs font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value.toLocaleString("en-IN")}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon size={18} />
        </div>

      </div>

    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    AVAILABLE:
      "bg-emerald-50 text-emerald-600",
    RESERVED:
      "bg-amber-50 text-amber-600",
    UNAVAILABLE:
      "bg-rose-50 text-rose-600",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ??
        "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}

function EmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  return (
    <div className="p-12 text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Package size={22} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        No resources yet
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">
        Add equipment, staff or other resources required
        for this event.
      </p>

      <button
        onClick={onAdd}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
      >
        <Plus size={14} />
        Add Resource
      </button>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-300 focus:border-slate-400"
      />

    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
      >
        {options.map(([optionValue, label]) => (
          <option
            key={optionValue}
            value={optionValue}
          >
            {label}
          </option>
        ))}
      </select>

    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">

      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

        <div className="flex items-start justify-between border-b border-slate-100 p-5">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {description}
            </p>

          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>

        </div>

        <div className="p-5">
          {children}
        </div>

      </div>

    </div>
  );
}

function ModalActions({
  onCancel,
  onSubmit,
  submitLabel,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  return (
    <div className="mt-5 flex justify-end gap-3 border-t border-slate-100 pt-5">

      <button
        onClick={onCancel}
        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        Cancel
      </button>

      <button
        onClick={onSubmit}
        className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {submitLabel}
      </button>

    </div>
  );
}