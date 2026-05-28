"use client";

import { useState } from "react";
import { Node } from "reactflow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getNodeType, NodeConfigField } from "@/lib/node-registry";

interface NodeConfigPanelProps {
  node: Node;
  onUpdateLabel: (label: string) => void;
  onUpdateData: (key: string, value: any) => void;
  onDelete: () => void;
}

function ConfigField({
  field,
  value,
  nodeData,
  onChange,
}: {
  field: NodeConfigField;
  value: any;
  nodeData: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  const [copied, setCopied] = useState(false);

  // Conditional visibility
  if (field.showWhen) {
    const fieldValue = nodeData[field.showWhen.field];
    const allowed = Array.isArray(field.showWhen.value)
      ? field.showWhen.value.includes(fieldValue)
      : fieldValue === field.showWhen.value;
    if (!allowed) return null;
  }

  const currentValue = value ?? field.defaultValue ?? "";

  const handleCopy = () => {
    navigator.clipboard.writeText(String(currentValue));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Readonly field — show as copyable text
  if (field.readonly) {
    return (
      <div>
        <Label className="text-xs text-muted-foreground">
          {field.label}
        </Label>
        <div className="flex gap-1 mt-1">
          <Input
            value={currentValue}
            readOnly
            placeholder={field.placeholder}
            className="text-xs font-mono bg-muted/50 cursor-default"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0"
            disabled={!currentValue}
          >
            {copied ? "✓" : "Copy"}
          </Button>
        </div>
        {field.helpText && (
          <p className="text-[10px] text-muted-foreground mt-1">{field.helpText}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <Label className="text-xs text-muted-foreground">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>

      {field.type === "text" && (
        <Input
          value={currentValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="mt-1"
        />
      )}

      {field.type === "number" && (
        <Input
          type="number"
          value={currentValue}
          onChange={(e) => onChange(field.key, Number(e.target.value))}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          className="mt-1"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={currentValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] font-mono resize-y"
        />
      )}

      {field.type === "select" && (
        <select
          value={currentValue}
          onChange={(e) => onChange(field.key, e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.helpText && (
        <p className="text-[10px] text-muted-foreground mt-1">{field.helpText}</p>
      )}
    </div>
  );
}

export function NodeConfigPanel({
  node,
  onUpdateLabel,
  onUpdateData,
  onDelete,
}: NodeConfigPanelProps) {
  const nodeType = getNodeType(node.data.nodeType as string);
  const configFields = nodeType.configFields;

  return (
    <div className="space-y-4">
      {/* Node header */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background">
        <span className="text-2xl">{nodeType.icon}</span>
        <div>
          <div className="font-medium">{node.data.label as string}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {node.data.nodeType as string}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* Label editor */}
        <div>
          <Label className="text-xs text-muted-foreground">Node Name</Label>
          <Input
            value={node.data.label as string}
            onChange={(e) => onUpdateLabel(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Config fields from registry */}
        {configFields.length > 0 && (
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Configuration
            </p>
            {configFields.map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                value={node.data[field.key]}
                nodeData={node.data as Record<string, any>}
                onChange={onUpdateData}
              />
            ))}
          </div>
        )}

        {/* Retry & Failure Policy (action/logic nodes only) */}
        {nodeType.category !== "trigger" && (
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Retry & Failure
            </p>
            <div>
              <Label className="text-xs text-muted-foreground">Retry Count</Label>
              <Input
                type="number"
                value={(node.data.retryCount as number) ?? 0}
                onChange={(e) => onUpdateData("retryCount", Number(e.target.value))}
                min={0}
                max={10}
                placeholder="0"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Number of retry attempts on failure (0 = no retry)</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Retry Delay (ms)</Label>
              <Input
                type="number"
                value={(node.data.retryDelay as number) ?? 1000}
                onChange={(e) => onUpdateData("retryDelay", Number(e.target.value))}
                min={100}
                max={60000}
                step={100}
                placeholder="1000"
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Delay between retry attempts in milliseconds</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`exp-backoff-${node.id}`}
                checked={(node.data.exponentialBackoff as boolean) ?? false}
                onChange={(e) => onUpdateData("exponentialBackoff", e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor={`exp-backoff-${node.id}`} className="text-xs text-muted-foreground cursor-pointer">
                Exponential backoff
              </Label>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">On Failure</Label>
              <select
                value={(node.data.onFailure as string) || "stop"}
                onChange={(e) => onUpdateData("onFailure", e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="stop">Stop workflow</option>
                <option value="continue">Continue (skip node)</option>
                <option value="fallback">Route to fallback</option>
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">What to do if this node fails after all retries</p>
            </div>
            {node.data.onFailure === "fallback" && (
              <div>
                <Label className="text-xs text-muted-foreground">Fallback Node ID</Label>
                <Input
                  value={(node.data.fallbackNodeId as string) || ""}
                  onChange={(e) => onUpdateData("fallbackNodeId", e.target.value)}
                  placeholder="Enter node ID"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Node to execute on failure (paste the target node ID)</p>
              </div>
            )}
          </div>
        )}

        {/* Node metadata (read-only) */}
        <div className="pt-2 border-t border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Info
          </p>
          <div>
            <Label className="text-xs text-muted-foreground">Node ID</Label>
            <Input value={node.id} disabled className="mt-1 text-xs" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Position</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={`x: ${Math.round(node.position.x)}`}
                disabled
                className="flex-1 text-xs"
              />
              <Input
                value={`y: ${Math.round(node.position.y)}`}
                disabled
                className="flex-1 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={onDelete}
      >
        Delete Node
      </Button>
    </div>
  );
}
