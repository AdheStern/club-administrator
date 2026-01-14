// src/components/administration/departments/department-tree.tsx

"use client";

import { Building2, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DepartmentNode {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children: DepartmentNode[];
  userCount: number;
}

interface DepartmentTreeNodeProps {
  node: DepartmentNode;
  level: number;
  onSelect?: (node: DepartmentNode) => void;
}

function DepartmentTreeNode({
  node,
  level,
  onSelect,
}: DepartmentTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent transition-colors",
          "cursor-pointer group"
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded);
          }
          onSelect?.(node);
        }}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        <Building2 className="h-4 w-4 text-muted-foreground" />

        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium group-hover:text-primary">
              {node.name}
            </span>
            {node.description && (
              <span className="text-xs text-muted-foreground">
                {node.description}
              </span>
            )}
          </div>

          {node.userCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{node.userCount}</span>
            </div>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="space-y-0.5">
          {node.children.map((child) => (
            <DepartmentTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DepartmentTreeProps {
  hierarchy: DepartmentNode[];
  onSelect?: (node: DepartmentNode) => void;
  className?: string;
}

export function DepartmentTree({
  hierarchy,
  onSelect,
  className,
}: DepartmentTreeProps) {
  if (hierarchy.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          No hay departamentos creados
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {hierarchy.map((node) => (
        <DepartmentTreeNode
          key={node.id}
          node={node}
          level={0}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
