// Naming for the maximum-dev local Kind cluster's ArgoCD apps, mirrored from
// usemaximum/maximum's dev-cd/devcd/commands/argocd_bootstrap.py
// (branch_suffix, bank_instance, bank_namespace) and argocd_app.py
// (parent_app_name): branch-slug-based, unlike remote's PR-number convention.
// No imports, so it runs in the mod and under `node --test`.

export const LOCAL_CONTEXT = "kind-maximum-dev";
export const LOCAL_CLUSTER_NAME = "max1-dev-us-lcl-k1";
// CHILD_APP_GROUPS from dev-tooling/tasks/argocd/groups.py, plus the "test"
// group only Kind bootstraps.
export const LOCAL_CHILD_GROUPS = ["mesh", "databases", "infra", "platform", "ingress", "test"];

export function branchSuffix(branch) {
  if (!branch || branch === "main") return "";
  const slug = branch.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 20).replace(/^-+|-+$/g, "");
  return slug ? `-${slug}` : "";
}

export const bankInstance = (suffix) => suffix.replace(/^-+/, "") || "main";
export const bankNamespace = (suffix) => `bnk-max1-${bankInstance(suffix)}`;
export const parentAppName = (suffix) => `${LOCAL_CLUSTER_NAME}-bnk${suffix}`;
