#!/usr/bin/env bash
# CI merge gates shared by GitHub Actions and Azure Pipelines.
# Usage: ci-gates.sh <secrets|changelog|readme|comments> [base-branch]
# An empty base-branch scans full history (secrets) or skips the PR-only gates.
# LABELS: space-separated PR labels; skip-changelog / skip-readme-check / skip-comment-check bypass a gate.
set -uo pipefail
gate=${1:-}
branch=${2:-}
branch=${branch#refs/heads/}
base="origin/$branch"

fail() {
  if [ -n "${TF_BUILD:-}" ]; then echo "##vso[task.logissue type=error]$1"; else echo "::error::$1"; fi
  exit 1
}
bypassed() {
  case " ${LABELS:-} " in *" $1 "*) echo "$1 label present — OK"; return 0 ;; esac
  return 1
}
pr_only() {
  [ -n "$branch" ] || { echo "$gate: not a pull request — skipped"; exit 0; }
}

case "$gate" in
  secrets)
    GITLEAKS_VERSION="8.30.1"   # bump VERSION and SHA256 together, from the release's gitleaks_<version>_checksums.txt
    GITLEAKS_SHA256="551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb"   # gitleaks_<version>_linux_x64.tar.gz
    if ! command -v gitleaks >/dev/null 2>&1; then
      tmp=${RUNNER_TEMP:-${AGENT_TEMPDIRECTORY:-$(mktemp -d)}}
      curl -fsSL -o "$tmp/gitleaks.tar.gz" "https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}/gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz" || fail "gitleaks download failed"
      echo "${GITLEAKS_SHA256}  $tmp/gitleaks.tar.gz" | sha256sum -c - || fail "gitleaks checksum mismatch"
      sudo tar -xzf "$tmp/gitleaks.tar.gz" -C /usr/local/bin gitleaks || fail "gitleaks install failed"
    fi
    if [ -n "$branch" ]; then
      gitleaks git --redact --no-banner --log-opts="$base..HEAD" || fail "gitleaks found secrets in this PR's commits"
    else
      gitleaks git --redact --no-banner || fail "gitleaks found secrets in history"
    fi
    ;;
  changelog)
    pr_only
    changed=$(git diff --name-only "$base"...HEAD)
    if printf '%s\n' "$changed" | grep -qE '^src/' && ! printf '%s\n' "$changed" | grep -qx 'CHANGELOG.md'; then
      bypassed skip-changelog && exit 0
      fail "src/ changed but CHANGELOG.md was not updated. Add an entry or apply the 'skip-changelog' label."
    fi
    ;;
  readme)
    pr_only
    tmp=$(mktemp)
    git diff --name-only "$base"...HEAD > "$tmp"
    missing=""
    while IFS= read -r f; do
      case "$f" in */README.md|README.md) continue ;; esac
      # documentation-kit.md never writes a README into these folders, so never demand one
      case "$f" in .github/*|.azuredevops/*|azure-pipelines/*|.claude/*|*/.claude/*|secrets/*|*/secrets/*|.secrets/*|*/.secrets/*) continue ;; esac
      d=$(dirname "$f")
      rm_path="README.md"
      [ "$d" != "." ] && rm_path="$d/README.md"
      grep -qxF "$rm_path" "$tmp" || missing="$missing\n  - $d/"
    done < "$tmp"
    rm -f "$tmp"
    missing=$(printf '%b' "$missing" | sort -u)
    if [ -n "$missing" ]; then
      bypassed skip-readme-check && exit 0
      printf '%s\n' "$missing"
      fail "Folders changed without updating their README.md (listed above). Update them or apply the 'skip-readme-check' label."
    fi
    ;;
  comments)
    pr_only
    patterns=".claude/comment-hygiene-patterns.txt"
    [ -f "$patterns" ] || fail "comment-hygiene pattern list missing ($patterns)"
    strict_patterns=$(mktemp)
    head -n 10 "$patterns" > "$strict_patterns"
    nl=$(printf '\nx'); nl=${nl%x}
    flagged=""
    while IFS= read -r -d '' f; do
      case "$f" in *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.py) ;; *) continue ;; esac
      [ -f "$f" ] || continue
      while IFS= read -r content; do
        stripped=$(printf '%s' "$content" | sed -E 's@^[[:space:]]*(#|//|\*|"""|/\*\*?)[[:space:]]?@@')
        if [ -n "$stripped" ] && printf '%s' "$stripped" | grep -qEf "$strict_patterns"; then
          flagged="$flagged$nl  - $f: $stripped"
        fi
      done < <(git diff -U0 "$base"...HEAD -- "$f" | grep '^+' | grep -vE '^\+\+\+' | sed 's/^+//' | grep -E '^[[:space:]]*(#|//|\*|"""|/\*\*?)')
    done < <(git diff -z --name-only "$base"...HEAD)
    rm -f "$strict_patterns"
    if [ -n "$flagged" ]; then
      bypassed skip-comment-check && exit 0
      printf '%s\n' "$flagged"
      fail "Change-narration comments found (listed above). State WHAT the code does now, or apply the 'skip-comment-check' label."
    fi
    ;;
  *)
    echo "usage: ci-gates.sh <secrets|changelog|readme|comments> [base-branch]" >&2
    exit 2
    ;;
esac
exit 0
