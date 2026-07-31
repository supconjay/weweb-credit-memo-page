<template>
  <div class="pp-root" :class="themeClass" :style="rootStyle">
    <!-- ── Page header ─────────────────────────────────────────────── -->
    <header v-if="content.showHeader !== false" class="pp-head">
      <div class="pp-head__left">
        <h2 class="pp-title">{{ content.title || 'Credit Memo Approvals' }}</h2>
        <p v-if="content.subtitle" class="pp-sub">{{ content.subtitle }}</p>
      </div>
      <div class="pp-head__right">
        <div v-if="content.searchable !== false" class="pp-search">
          <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('search')"></path></svg>
          <input v-model="query" type="text" :placeholder="content.searchPlaceholder || 'Search credit memos...'" />
        </div>
        <span v-if="isAdmin" class="pp-adminbadge">
          <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('shield')"></path></svg>{{ content.adminBadgeLabel || 'Admin' }}
        </span>
      </div>
    </header>

    <!-- ── Summary ─────────────────────────────────────────────────── -->
    <div v-if="content.showSummary !== false" class="pp-stats">
      <div class="pp-stat" :class="{ 'pp-stat--live': counts.mine > 0 }">
        <span class="pp-stat__label">{{ content.statMineLabel || 'Awaiting you' }}</span>
        <span class="pp-stat__value">{{ counts.mine }}</span>
      </div>
      <div class="pp-stat">
        <span class="pp-stat__label">{{ content.statPendingLabel || 'In review' }}</span>
        <span class="pp-stat__value">{{ counts.pending }}</span>
      </div>
      <div class="pp-stat">
        <span class="pp-stat__label">{{ content.statApprovedLabel || 'Fully approved' }}</span>
        <span class="pp-stat__value">{{ counts.approved }}</span>
      </div>
      <div class="pp-stat">
        <span class="pp-stat__label">{{ content.statValueLabel || 'Pending value' }}</span>
        <span class="pp-stat__value">{{ money(pendingAmount) }}</span>
      </div>
    </div>

    <!-- ── Tabs ────────────────────────────────────────────────────── -->
    <nav v-if="content.showTabs !== false" class="pp-tabs">
      <button
        v-for="t in tabs"
        :key="t.id"
        type="button"
        class="pp-tab"
        :class="{ 'pp-tab--active': tab === t.id }"
        @click="setTab(t.id)"
      >
        {{ t.label }}<span class="pp-tab__count">{{ t.count }}</span>
      </button>
    </nav>

    <!-- ── Empty ───────────────────────────────────────────────────── -->
    <div v-if="!rows.length" class="pp-empty">
      <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('file-text')"></path></svg>
      <span>{{ emptyText }}</span>
    </div>

    <!-- ── Cards ───────────────────────────────────────────────────── -->
    <div v-else class="pp-list">
      <article
        v-for="(r, i) in pagedRows"
        :key="rowKey(r, pageOffset + i)"
        class="pp-memo"
        :class="{ 'pp-memo--done': isComplete(r), 'pp-memo--mine': needsMe(r) }"
      >
        <!-- head -->
        <div class="pp-memo__head">
          <span class="pp-memo__icon" :class="'pp-memo__icon--' + stateOf(r)">
            <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic(stateIcon(r))"></path></svg>
          </span>
          <div class="pp-memo__id">
            <button type="button" class="pp-memo__title" @click="emitOpen(r, pageOffset + i)">
              {{ text(r, 'titleKey') || 'Credit memo' }}
            </button>
            <div class="pp-memo__meta">
              <span class="pp-pill" :class="'pp-pill--' + statusTone(r)">
                <span class="pp-pill__dot"></span>{{ text(r, 'statusKey') || 'Pending' }}
              </span>
              <span v-if="text(r, 'lobKey')" class="pp-chip">{{ text(r, 'lobKey') }}</span>
              <span v-if="text(r, 'invoiceKey')" class="pp-metaitem">
                <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('file-text')"></path></svg>{{ text(r, 'invoiceKey') }}
              </span>
            </div>
          </div>
          <div class="pp-memo__amt">
            <span class="pp-memo__amtval">{{ money(num(r, 'amountKey')) }}</span>
            <span class="pp-memo__amtlbl">{{ content.amountLabel || 'Credit' }}</span>
          </div>
        </div>

        <!-- body -->
        <div class="pp-memo__body">
          <div v-if="text(r, 'reasonKey')" class="pp-reason">
            <span class="pp-reason__label">{{ content.reasonLabel || 'Reason' }}</span>
            <p class="pp-reason__text">{{ text(r, 'reasonKey') }}</p>
          </div>
          <div class="pp-facts">
            <span v-if="text(r, 'submittedByKey')" class="pp-fact">
              <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('user')"></path></svg>{{ text(r, 'submittedByKey') }}
            </span>
            <span v-if="text(r, 'createdKey')" class="pp-fact">
              <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('calendar')"></path></svg>{{ fmtDate(raw(r, 'createdKey')) }}
            </span>
          </div>
        </div>

        <!-- approvals -->
        <div class="pp-appr">
          <div class="pp-appr__head">
            <span class="pp-appr__title">{{ content.approvalsLabel || 'Approvals' }}</span>
            <span class="pp-appr__prog" :class="{ 'pp-appr__prog--done': isComplete(r) }">
              {{ approvedCount(r) }} {{ content.ofLabel || 'of' }} 2
            </span>
          </div>

          <div class="pp-slots">
            <button
              v-for="n in [1, 2]"
              :key="n"
              type="button"
              class="pp-slot"
              :class="{
                'pp-slot--on': slot(r, n).approved,
                'pp-slot--mine': slot(r, n).mine,
                'pp-slot--open': canToggle(r, n) && !slot(r, n).approved,
                'pp-slot--locked': !canToggle(r, n),
              }"
              :disabled="!canToggle(r, n)"
              @click="toggleSlot(r, pageOffset + i, n)"
            >
              <span class="pp-slot__box">
                <svg v-if="slot(r, n).approved" class="pp-svg" v-bind="svgAttrs"><path :d="ic('check')"></path></svg>
              </span>
              <span class="pp-slot__txt">
                <span class="pp-slot__label">{{ n === 1 ? (content.approval1Label || 'Approval 1') : (content.approval2Label || 'Approval 2') }}</span>
                <span class="pp-slot__who">{{ slotWho(r, n) }}</span>
              </span>
              <span v-if="canToggle(r, n)" class="pp-slot__cta">
                {{ slot(r, n).approved ? (content.undoLabel || 'Undo') : (content.approveLabel || 'Approve') }}
              </span>
              <svg v-else-if="!slot(r, n).approved" class="pp-svg pp-slot__lock" v-bind="svgAttrs"><path :d="ic('lock')"></path></svg>
            </button>
          </div>

          <!-- admin approval -->
          <div v-if="showAdmin" class="pp-adminrow" :class="{ 'pp-adminrow--on': adminApproved(r) }">
            <span class="pp-adminrow__icon">
              <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('shield')"></path></svg>
            </span>
            <span class="pp-adminrow__txt">
              <span class="pp-adminrow__label">{{ content.adminApprovalLabel || 'Admin approval' }}</span>
              <span class="pp-adminrow__who">{{ adminApproved(r) ? (content.adminApprovedText || 'Approved by admin') : (content.adminPendingText || 'Not applied') }}</span>
            </span>
            <button type="button" class="pp-btn" :class="adminApproved(r) ? 'pp-btn--ghost' : 'pp-btn--admin'" @click="toggleAdmin(r, pageOffset + i)">
              {{ adminApproved(r) ? (content.undoLabel || 'Undo') : (content.adminApproveLabel || 'Admin approve') }}
            </button>
          </div>

          <!-- footer note / actions -->
          <div v-if="noteFor(r) || content.showDecline === true || content.showOpen !== false" class="pp-foot">
            <p v-if="noteFor(r)" class="pp-note">
              <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('info')"></path></svg>{{ noteFor(r) }}
            </p>
            <span class="pp-foot__spacer"></span>
            <button v-if="content.showDecline === true" type="button" class="pp-btn pp-btn--danger" @click="emitDecline(r, pageOffset + i)">
              {{ content.declineLabel || 'Decline' }}
            </button>
            <button v-if="content.showOpen !== false" type="button" class="pp-btn pp-btn--ghost" @click="emitOpen(r, pageOffset + i)">
              {{ content.openLabel || 'View details' }}
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- ── Pager ───────────────────────────────────────────────────── -->
    <div v-if="paginationActive" class="pp-pager">
      <button class="pp-pager__btn" type="button" :disabled="page <= 1" aria-label="Previous page" @click="goPage(page - 1)">
        <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('chevron-left')"></path></svg>
      </button>
      <button
        v-for="(p, i) in pageWindow"
        :key="i"
        type="button"
        class="pp-pager__num"
        :class="{ 'pp-pager__num--active': p === page, 'pp-pager__num--gap': p === '…' }"
        :disabled="p === '…'"
        @click="p !== '…' && goPage(p)"
      >{{ p }}</button>
      <button class="pp-pager__btn" type="button" :disabled="page >= totalPages" aria-label="Next page" @click="goPage(page + 1)">
        <svg class="pp-svg" v-bind="svgAttrs"><path :d="ic('chevron-right')"></path></svg>
      </button>
    </div>
  </div>
</template>

<script>
const ICONS = {
  check: "M20 6L9 17l-5-5",
  "check-circle": "M22 11.1V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  circle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "file-text": "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  lock: "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16v-4M12 8h.01",
  "chevron-left": "M15 18l-6-6 6-6",
  "chevron-right": "M9 18l6-6-6-6",
};

// Field mapping: prop name -> default field name in the collection.
const KEYS = {
  idKey: "id",
  titleKey: "UID",
  amountKey: "Amount",
  statusKey: "Status",
  reasonKey: "Reason",
  invoiceKey: "Name (from Invoice)",
  lobKey: "lob_name",
  submittedByKey: "submitted_by_name",
  createdKey: "Created",
  approval1Key: "Approval 1",
  approval2Key: "Approval 2",
  approver1Key: "Approver 1",
  approver2Key: "Approver 2",
  approversKey: "credit_memo_approvers_supabase_ids",
  adminApprovalKey: "Admin Approval",
  adminApproverKey: "Admin Approver",
};

export default {
  props: { content: { type: Object, required: true }, uid: { type: String, required: false } },
  emits: ["trigger-event"],
  data() {
    return { page: 1, query: "", tab: "all", localEdits: {} };
  },
  watch: {
    // Optimistic ticks are dropped as soon as the bound collection re-fetches.
    rawRows() { this.localEdits = {}; },
    query() { this.page = 1; },
    rowCount(n) {
      const tp = Math.max(1, Math.ceil(n / this.pageSize));
      if (this.page > tp) this.page = tp;
    },
  },
  computed: {
    rawRows() {
      const src = this.content.items;
      if (Array.isArray(src)) return src;
      if (src && typeof src === "object") {
        if (Array.isArray(src.data)) return src.data;
        if (Array.isArray(src.items)) return src.items;
      }
      return [];
    },
    isAdmin() { return this.truthy(this.content.isAdmin); },
    showAdmin() { return this.isAdmin && this.content.showAdminApproval !== false; },
    // Every id that identifies the signed-in user. `currentUserId` is matched
    // against the approver-ids array; `currentUserRecordId` (optional) is the
    // record id stored in Approver 1 / Approver 2, used to label "You" and to
    // stop one person from filling both slots.
    myIds() {
      const out = [];
      const push = (v) => {
        if (v == null || v === "") return;
        if (Array.isArray(v)) { v.forEach(push); return; }
        out.push(String(this.idOf(v)));
      };
      push(this.content.currentUserId);
      push(this.content.currentUserRecordId);
      return out;
    },
    directory() {
      const src = this.content.directory;
      let list = [];
      if (Array.isArray(src)) list = src;
      else if (src && typeof src === "object" && Array.isArray(src.data)) list = src.data;
      const idK = this.content.directoryIdKey || "id";
      const nameK = this.content.directoryNameKey || "name";
      const map = {};
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        if (!it || typeof it !== "object") continue;
        const id = it[idK];
        if (id == null || id === "") continue;
        map[String(id)] = this.flat(it[nameK]);
      }
      return map;
    },
    filtered() {
      let rows = this.rawRows.filter((r) => r && typeof r === "object");
      const q = this.content.searchable !== false ? String(this.query || "").trim().toLowerCase() : "";
      if (q) {
        rows = rows.filter((r) =>
          ["titleKey", "reasonKey", "invoiceKey", "lobKey", "submittedByKey", "statusKey"].some(
            (k) => String(this.text(r, k)).toLowerCase().indexOf(q) !== -1
          )
        );
      }
      return rows;
    },
    counts() {
      let mine = 0, pending = 0, approved = 0;
      for (let i = 0; i < this.filtered.length; i++) {
        const r = this.filtered[i];
        if (this.isComplete(r)) approved++; else pending++;
        if (this.needsMe(r)) mine++;
      }
      return { all: this.filtered.length, mine, pending, approved };
    },
    tabs() {
      const c = this.counts;
      return [
        { id: "mine", label: this.content.tabMineLabel || "Needs my approval", count: c.mine },
        { id: "pending", label: this.content.tabPendingLabel || "In review", count: c.pending },
        { id: "approved", label: this.content.tabApprovedLabel || "Approved", count: c.approved },
        { id: "all", label: this.content.tabAllLabel || "All", count: c.all },
      ];
    },
    rows() {
      const t = this.content.showTabs === false ? "all" : this.tab;
      let rows = this.filtered;
      if (t === "mine") rows = rows.filter((r) => this.needsMe(r));
      else if (t === "pending") rows = rows.filter((r) => !this.isComplete(r));
      else if (t === "approved") rows = rows.filter((r) => this.isComplete(r));
      const sort = this.content.sortBy || "none";
      if (sort !== "none") {
        const dir = sort === "oldest" ? 1 : -1;
        rows = rows.slice().sort((a, b) => {
          if (sort === "amount") return (this.num(b, "amountKey") - this.num(a, "amountKey"));
          return (this.toTime(this.raw(a, "createdKey")) - this.toTime(this.raw(b, "createdKey"))) * dir;
        });
      }
      return rows;
    },
    pendingAmount() {
      let sum = 0;
      for (let i = 0; i < this.filtered.length; i++) {
        const r = this.filtered[i];
        if (!this.isComplete(r)) sum += this.num(r, "amountKey");
      }
      return sum;
    },
    emptyText() {
      if (this.query) return this.content.emptySearchText || "No credit memos match your search";
      if (this.tab === "mine") return this.content.emptyMineText || "Nothing is waiting on your approval";
      return this.content.emptyText || "No credit memos to show";
    },
    rowCount() { return this.rows.length; },
    pageSize() { const n = Number(this.content.pageSize); return n > 0 ? Math.floor(n) : 8; },
    paginationActive() { return this.content.paginate !== false && this.totalPages > 1; },
    totalPages() { return Math.max(1, Math.ceil(this.rowCount / this.pageSize)); },
    pageOffset() { return this.content.paginate !== false ? (this.page - 1) * this.pageSize : 0; },
    pagedRows() {
      if (this.content.paginate === false) return this.rows;
      return this.rows.slice(this.pageOffset, this.pageOffset + this.pageSize);
    },
    pageWindow() {
      const total = this.totalPages, cur = this.page;
      if (total <= 7) { const out = []; for (let i = 1; i <= total; i++) out.push(i); return out; }
      const out = [1];
      const start = Math.max(2, cur - 1), end = Math.min(total - 1, cur + 1);
      if (start > 2) out.push("…");
      for (let i = start; i <= end; i++) out.push(i);
      if (end < total - 1) out.push("…");
      out.push(total);
      return out;
    },
    svgAttrs() {
      return { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" };
    },
    themeClass() {
      const m = this.content.darkMode || "auto";
      return { "pp-auto": m === "auto", "pp-dark": m === "dark", "pp-light": m === "light" };
    },
    rootStyle() {
      return {
        "--pp-primary": this.content.primaryColor || "#10b981",
        "--pp-accent": this.content.accentColor || "#6366f1",
        "--pp-radius": (this.content.radius != null ? this.content.radius : 16) + "px",
        "--pp-gap": (this.content.gap != null ? this.content.gap : 16) + "px",
      };
    },
  },
  methods: {
    ic(name) { return ICONS[name] || ""; },

    /* ---- value helpers ---- */
    key(name) { const v = this.content[name]; return v != null && v !== "" ? String(v) : KEYS[name]; },
    // Raw field value, with any un-saved local tick applied on top.
    raw(r, name) {
      if (!r) return undefined;
      const k = this.key(name);
      const id = this.rowId(r);
      const edits = id !== "" ? this.localEdits[id] : null;
      if (edits && Object.prototype.hasOwnProperty.call(edits, k)) return edits[k];
      return r[k];
    },
    idOf(v) {
      if (v == null) return "";
      if (typeof v === "object") return v.id != null ? v.id : (v.value != null ? v.value : (v.uid != null ? v.uid : ""));
      return v;
    },
    flat(v) {
      if (Array.isArray(v)) {
        return v.map((x) => this.flat(x)).filter((s) => s !== "").join(", ");
      }
      if (v && typeof v === "object") return v.name || v.label || v.title || v.value || "";
      return v == null ? "" : String(v);
    },
    text(r, name) { return this.flat(this.raw(r, name)); },
    num(r, name) {
      const v = this.raw(r, name);
      const n = Number(Array.isArray(v) ? v[0] : v);
      return isFinite(n) ? n : 0;
    },
    truthy(v) {
      const x = Array.isArray(v) ? v[0] : v;
      if (x === true) return true;
      if (typeof x === "string") return /^(true|yes|1|y)$/i.test(x.trim());
      return x === 1;
    },
    toTime(v) { const d = new Date(Array.isArray(v) ? v[0] : v); return isNaN(d.getTime()) ? 0 : d.getTime(); },
    idList(v) {
      if (v == null || v === "") return [];
      const arr = Array.isArray(v) ? v : [v];
      return arr.map((x) => String(this.idOf(x))).filter((s) => s !== "");
    },
    rowId(r) {
      const v = r ? r[this.key("idKey")] : "";
      return v == null || v === "" ? "" : String(v);
    },
    rowKey(r, absIndex) { const id = this.rowId(r); return id !== "" ? id : "i" + absIndex; },
    money(n) {
      const prefix = this.content.currencyPrefix != null ? this.content.currencyPrefix : "$";
      const v = Number(n) || 0;
      const s = prefix + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return v < 0 ? "-" + s : s;
    },
    fmtDate(v) {
      const raw = Array.isArray(v) ? v[0] : v;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw == null ? "" : raw);
      return d.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
    },

    /* ---- approval state ---- */
    // One approval slot: is it ticked, who holds it, and is that me?
    slot(r, n) {
      const approved = this.truthy(this.raw(r, n === 1 ? "approval1Key" : "approval2Key"));
      const ids = this.idList(this.raw(r, n === 1 ? "approver1Key" : "approver2Key"));
      const mine = ids.some((id) => this.myIds.indexOf(id) !== -1);
      return { approved, ids, mine };
    },
    approvedCount(r) { return (this.slot(r, 1).approved ? 1 : 0) + (this.slot(r, 2).approved ? 1 : 0); },
    isComplete(r) { return this.approvedCount(r) >= 2 || (this.content.adminCompletes === true && this.adminApproved(r)); },
    adminApproved(r) { return this.truthy(this.raw(r, "adminApprovalKey")); },
    // Is the signed-in user one of this memo's designated approvers?
    isApprover(r) {
      if (this.content.requireApproverMatch === false) return true;
      const list = this.idList(this.raw(r, "approversKey"));
      if (!list.length) return this.content.allowWhenNoApprovers === true;
      if (!this.myIds.length) return false;
      return list.some((id) => this.myIds.indexOf(id) !== -1);
    },
    adminCanOverride() { return this.isAdmin && this.content.adminOverride !== false; },
    // Can the signed-in user tick / untick this slot right now?
    canToggle(r, n) {
      const s = this.slot(r, n);
      const admin = this.adminCanOverride();
      if (s.approved) {
        if (this.content.allowRevoke === false) return false;
        return admin || s.mine;
      }
      if (admin) return true;
      if (!this.isApprover(r)) return false;
      // One person cannot hold both approvals (needs currentUserRecordId to detect).
      if (this.content.preventDoubleApproval !== false) {
        const other = this.slot(r, n === 1 ? 2 : 1);
        if (other.approved && other.mine) return false;
      }
      return true;
    },
    needsMe(r) {
      if (this.isComplete(r)) return false;
      if (!this.isApprover(r)) return false;
      return (!this.slot(r, 1).approved && this.canToggle(r, 1)) || (!this.slot(r, 2).approved && this.canToggle(r, 2));
    },
    slotWho(r, n) {
      const s = this.slot(r, n);
      if (s.approved) {
        if (s.mine) return this.content.youText || "Approved by you";
        const name = s.ids.map((id) => this.directory[id]).filter(Boolean).join(", ");
        return name || (this.content.approvedText || "Approved");
      }
      const name = s.ids.map((id) => this.directory[id]).filter(Boolean).join(", ");
      if (name) return (this.content.assignedText || "Assigned to") + " " + name;
      return this.content.awaitingText || "Awaiting approval";
    },
    stateOf(r) {
      if (this.isComplete(r)) return "done";
      if (this.approvedCount(r) === 1) return "half";
      return "open";
    },
    stateIcon(r) {
      const s = this.stateOf(r);
      return s === "done" ? "check-circle" : (s === "half" ? "clock" : "circle");
    },
    statusTone(r) {
      const s = String(this.text(r, "statusKey")).toLowerCase();
      if (/declin|reject|denied|void|cancel/.test(s)) return "danger";
      if (/review|pending|await|hold|progress|submitted/.test(s)) return "warning";
      if (/approv|complete|done|closed|applied|issued/.test(s)) return "success";
      if (/new|draft|open/.test(s)) return "info";
      return "slate";
    },
    noteFor(r) {
      if (this.isComplete(r)) return this.content.completeNote || "Fully approved — ready to process.";
      if (this.adminCanOverride()) return null;
      if (!this.isApprover(r)) return this.content.notApproverNote || "You are not listed as an approver on this credit memo.";
      const s1 = this.slot(r, 1), s2 = this.slot(r, 2);
      if (this.content.preventDoubleApproval !== false && ((s1.approved && s1.mine && !s2.approved) || (s2.approved && s2.mine && !s1.approved))) {
        return this.content.secondApproverNote || "Your approval is recorded — a second approver is still required.";
      }
      return null;
    },

    /* ---- actions ---- */
    setLocal(r, fieldKey, value) {
      const id = this.rowId(r);
      if (id === "") return;
      const next = Object.assign({}, this.localEdits);
      next[id] = Object.assign({}, next[id] || {}, { [fieldKey]: value });
      this.localEdits = next;
    },
    toggleSlot(r, index, n) {
      if (!this.canToggle(r, n)) return;
      const s = this.slot(r, n);
      const value = !s.approved;
      const field = this.key(n === 1 ? "approval1Key" : "approval2Key");
      const approverField = this.key(n === 1 ? "approver1Key" : "approver2Key");
      this.setLocal(r, field, value);
      this.$emit("trigger-event", {
        name: value ? "approve" : "unapprove",
        event: {
          id: this.rowId(r),
          index,
          slot: n,
          field,
          approverField,
          previous: s.approved,
          value,
          userId: this.content.currentUserId != null ? this.content.currentUserId : "",
          approverId: this.content.currentUserRecordId != null ? this.content.currentUserRecordId : "",
          isAdminOverride: !this.isApprover(r) && this.adminCanOverride(),
          row: r || {},
        },
      });
    },
    toggleAdmin(r, index) {
      const prev = this.adminApproved(r);
      const value = !prev;
      const field = this.key("adminApprovalKey");
      this.setLocal(r, field, value);
      this.$emit("trigger-event", {
        name: value ? "adminApprove" : "adminUnapprove",
        event: {
          id: this.rowId(r),
          index,
          field,
          approverField: this.key("adminApproverKey"),
          previous: prev,
          value,
          userId: this.content.currentUserId != null ? this.content.currentUserId : "",
          approverId: this.content.currentUserRecordId != null ? this.content.currentUserRecordId : "",
          row: r || {},
        },
      });
    },
    emitOpen(r, index) {
      this.$emit("trigger-event", { name: "openMemo", event: { id: this.rowId(r), index, row: r || {} } });
    },
    emitDecline(r, index) {
      this.$emit("trigger-event", { name: "decline", event: { id: this.rowId(r), index, row: r || {} } });
    },
    setTab(id) {
      if (this.tab === id) return;
      this.tab = id;
      this.page = 1;
      this.$emit("trigger-event", { name: "tabChange", event: { tab: id } });
    },
    goPage(p) {
      const next = Math.max(1, Math.min(this.totalPages, p));
      if (next === this.page) return;
      this.page = next;
      this.$emit("trigger-event", { name: "pageChange", event: { page: next } });
    },
  },
  mounted() {
    const t = this.content.defaultTab;
    if (t && ["all", "mine", "pending", "approved"].indexOf(t) !== -1) this.tab = t;
  },
};
</script>

<style lang="scss" scoped>
.pp-root {
  --surface: #ffffff; --surface-2: #f7f9fc; --surface-3: #eef2f7; --border: #e4e9f0; --border-strong: #d4dbe6;
  --text: #1f2a37; --text-muted: #64748b; --text-subtle: #94a3b8;
  --shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px rgba(16, 24, 40, 0.06);
  --ok: #10b981; --info: #3b82f6; --warn: #f59e0b; --danger: #ef4444;
  --accent: var(--pp-accent, #6366f1); --primary: var(--pp-primary, #10b981); --radius: var(--pp-radius, 16px);
  box-sizing: border-box; width: 100%; max-width: 100%; color: var(--text);
  container-type: inline-size;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.45;
}
.pp-root *, .pp-root *::before, .pp-root *::after { box-sizing: border-box; }
@mixin dark {
  --surface: #161f30; --surface-2: #1b2638; --surface-3: #202c40; --border: #28344a; --border-strong: #34425c;
  --text: #e8eef7; --text-muted: #94a3b8; --text-subtle: #64748b;
  --shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 12px 28px rgba(0, 0, 0, 0.35);
}
.pp-root.pp-dark { @include dark; }
@media (prefers-color-scheme: dark) { .pp-root.pp-auto { @include dark; } }

/* WeWeb forces the root to display:block, so spacing uses margins, not gap. */
.pp-root > .pp-head, .pp-root > .pp-stats, .pp-root > .pp-tabs, .pp-root > .pp-list, .pp-root > .pp-empty { margin-bottom: var(--pp-gap, 16px); }
.pp-root > .pp-list:last-child, .pp-root > .pp-empty:last-child { margin-bottom: 0; }

/* Header */
.pp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
.pp-title { margin: 0; font-size: clamp(19px, 2.4vw, 24px); font-weight: 800; letter-spacing: -0.01em; }
.pp-sub { margin: 4px 0 0; color: var(--text-muted); font-size: 13.5px; }
.pp-head__right { display: flex; align-items: center; gap: 10px; }
.pp-search { display: flex; align-items: center; gap: 7px; padding: 9px 13px; border: 1px solid var(--border-strong); border-radius: 10px; background: var(--surface); }
.pp-search .pp-svg { width: 15px; height: 15px; color: var(--text-subtle); flex: none; }
.pp-search input { border: none; background: transparent; outline: none; color: var(--text); font-family: inherit; font-size: 13.5px; width: 190px; max-width: 46vw; }
.pp-adminbadge { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); font-size: 12px; font-weight: 700; white-space: nowrap; }
.pp-adminbadge .pp-svg { width: 14px; height: 14px; }

/* Summary */
.pp-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.pp-stat { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); }
.pp-stat--live { border-color: color-mix(in srgb, var(--primary) 45%, var(--border)); background: color-mix(in srgb, var(--primary) 6%, var(--surface)); }
.pp-stat__label { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-subtle); }
.pp-stat__value { font-size: 20px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.pp-stat--live .pp-stat__value { color: var(--primary); }

/* Tabs */
.pp-tabs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; border-bottom: 1px solid var(--border); padding-bottom: 2px; }
.pp-tab { display: inline-flex; align-items: center; gap: 7px; padding: 9px 14px; border: none; border-bottom: 2px solid transparent; background: transparent; color: var(--text-muted); font-family: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: color .15s, border-color .15s; white-space: nowrap; }
.pp-tab:hover { color: var(--text); }
.pp-tab--active { color: var(--primary); border-bottom-color: var(--primary); }
.pp-tab__count { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: var(--surface-3); color: var(--text-muted); font-size: 11.5px; font-weight: 700; }
.pp-tab--active .pp-tab__count { background: color-mix(in srgb, var(--primary) 16%, transparent); color: var(--primary); }

/* Cards */
.pp-list { display: flex; flex-direction: column; }
.pp-memo { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: clamp(14px, 2vw, 20px); margin-bottom: 12px; }
.pp-memo:last-child { margin-bottom: 0; }
.pp-memo--mine { border-color: color-mix(in srgb, var(--primary) 45%, var(--border)); box-shadow: var(--shadow), 0 0 0 3px color-mix(in srgb, var(--primary) 10%, transparent); }
.pp-memo--done { background: color-mix(in srgb, var(--ok) 4%, var(--surface)); }

.pp-memo__head { display: flex; align-items: flex-start; gap: 12px; }
.pp-memo__icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; flex: none; }
.pp-memo__icon .pp-svg { width: 19px; height: 19px; }
.pp-memo__icon--done { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok); }
.pp-memo__icon--half { background: color-mix(in srgb, var(--warn) 16%, transparent); color: color-mix(in srgb, var(--warn) 85%, var(--text)); }
.pp-memo__icon--open { background: var(--surface-3); color: var(--text-subtle); }
.pp-memo__id { flex: 1; min-width: 0; }
.pp-memo__title { display: block; padding: 0; border: none; background: transparent; color: var(--text); font-family: inherit; font-size: 15.5px; font-weight: 700; text-align: left; cursor: pointer; line-height: 1.3; }
.pp-memo__title:hover { color: var(--primary); }
.pp-memo__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
.pp-metaitem { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 12.5px; }
.pp-metaitem .pp-svg { width: 13px; height: 13px; color: var(--text-subtle); }
.pp-chip { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 7px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); font-size: 11.5px; font-weight: 700; }
.pp-memo__amt { display: flex; flex-direction: column; align-items: flex-end; flex: none; }
.pp-memo__amtval { font-size: 19px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; white-space: nowrap; }
.pp-memo__amtlbl { font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-subtle); }

.pp-memo__body { margin-top: 12px; }
.pp-reason { padding: 11px 13px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 10px; }
.pp-reason__label { display: block; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-subtle); margin-bottom: 3px; }
.pp-reason__text { margin: 0; color: var(--text); font-size: 13.5px; }
.pp-facts { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 10px; }
.pp-fact { display: inline-flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 12.5px; }
.pp-fact .pp-svg { width: 14px; height: 14px; color: var(--text-subtle); }

/* Approvals */
.pp-appr { margin-top: 14px; padding-top: 13px; border-top: 1px dashed var(--border-strong); }
.pp-appr__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 9px; }
.pp-appr__title { font-size: 11.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--text-subtle); }
.pp-appr__prog { font-size: 12px; font-weight: 700; color: var(--text-muted); }
.pp-appr__prog--done { color: var(--ok); }

.pp-slots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.pp-slot { display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 13px; border: 1px solid var(--border); border-radius: 11px; background: var(--surface-2); color: var(--text); font-family: inherit; text-align: left; cursor: pointer; transition: border-color .15s, background .15s, box-shadow .15s; }
.pp-slot:disabled { cursor: default; }
.pp-slot__box { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--border-strong); background: var(--surface); flex: none; transition: background .15s, border-color .15s; }
.pp-slot__box .pp-svg { width: 13px; height: 13px; color: #fff; }
.pp-slot__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pp-slot__label { font-size: 13.5px; font-weight: 700; }
.pp-slot__who { font-size: 12px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pp-slot__cta { flex: none; padding: 4px 10px; border-radius: 7px; background: color-mix(in srgb, var(--primary) 14%, transparent); color: var(--primary); font-size: 11.5px; font-weight: 700; }
.pp-slot__lock { width: 14px; height: 14px; flex: none; color: var(--text-subtle); }

.pp-slot--open:hover { border-color: var(--primary); background: color-mix(in srgb, var(--primary) 7%, var(--surface-2)); }
.pp-slot--open:hover .pp-slot__box { border-color: var(--primary); }
.pp-slot--on { border-color: color-mix(in srgb, var(--ok) 40%, var(--border)); background: color-mix(in srgb, var(--ok) 8%, var(--surface-2)); }
.pp-slot--on .pp-slot__box { background: var(--ok); border-color: var(--ok); }
.pp-slot--on .pp-slot__cta { background: var(--surface-3); color: var(--text-muted); }
.pp-slot--locked { opacity: .72; }
.pp-slot--locked:not(.pp-slot--on) { background: transparent; border-style: dashed; }

/* Admin row */
.pp-adminrow { display: flex; align-items: center; gap: 11px; margin-top: 10px; padding: 11px 13px; border: 1px dashed color-mix(in srgb, var(--accent) 45%, var(--border)); border-radius: 11px; background: color-mix(in srgb, var(--accent) 5%, transparent); }
.pp-adminrow--on { border-style: solid; border-color: color-mix(in srgb, var(--accent) 55%, var(--border)); background: color-mix(in srgb, var(--accent) 10%, transparent); }
.pp-adminrow__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent); flex: none; }
.pp-adminrow__icon .pp-svg { width: 15px; height: 15px; }
.pp-adminrow__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.pp-adminrow__label { font-size: 13.5px; font-weight: 700; }
.pp-adminrow__who { font-size: 12px; color: var(--text-muted); }

/* Footer */
.pp-foot { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 11px; }
.pp-foot__spacer { flex: 1; }
.pp-note { display: inline-flex; align-items: center; gap: 7px; margin: 0; color: var(--text-muted); font-size: 12.5px; }
.pp-note .pp-svg { width: 14px; height: 14px; flex: none; color: var(--text-subtle); }

.pp-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 9px; border: 1px solid transparent; font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: filter .15s, background .15s, color .15s; white-space: nowrap; }
.pp-btn--admin { background: var(--accent); color: #fff; }
.pp-btn--admin:hover { filter: brightness(1.06); }
.pp-btn--ghost { background: transparent; border-color: var(--border-strong); color: var(--text-muted); }
.pp-btn--ghost:hover { background: var(--surface-3); color: var(--text); }
.pp-btn--danger { background: transparent; border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); color: var(--danger); }
.pp-btn--danger:hover { background: color-mix(in srgb, var(--danger) 10%, transparent); }

/* Pills */
.pp-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: 11.5px; font-weight: 700; white-space: nowrap; }
.pp-pill__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.pp-pill--success { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok); }
.pp-pill--danger { background: color-mix(in srgb, var(--danger) 14%, transparent); color: var(--danger); }
.pp-pill--warning { background: color-mix(in srgb, var(--warn) 16%, transparent); color: color-mix(in srgb, var(--warn) 82%, var(--text)); }
.pp-pill--info { background: color-mix(in srgb, var(--info) 14%, transparent); color: var(--info); }
.pp-pill--slate { background: var(--surface-3); color: var(--text-muted); }

/* Empty + pager */
.pp-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 54px 16px; color: var(--text-subtle); background: var(--surface); border: 1px dashed var(--border-strong); border-radius: var(--radius); }
.pp-empty .pp-svg { width: 30px; height: 30px; }
.pp-pager { display: flex; align-items: center; justify-content: center; gap: 6px; padding-top: 14px; border-top: 1px solid var(--border); flex-wrap: wrap; }
.pp-pager__btn { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer; transition: background .15s, color .15s; }
.pp-pager__btn:hover:not(:disabled) { background: var(--surface-3); color: var(--text); }
.pp-pager__btn:disabled { opacity: .4; cursor: default; }
.pp-pager__btn .pp-svg { width: 16px; height: 16px; }
.pp-pager__num { min-width: 34px; height: 34px; padding: 0 8px; border-radius: 9px; border: 1px solid transparent; background: transparent; color: var(--text-muted); font-family: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: background .15s, color .15s; }
.pp-pager__num:hover:not(:disabled):not(.pp-pager__num--active) { background: var(--surface-3); color: var(--text); }
.pp-pager__num--active { background: var(--primary); color: #fff; }
.pp-pager__num--gap { cursor: default; color: var(--text-subtle); }
.pp-svg { display: block; }

/* Responsive */
@container (max-width: 820px) {
  .pp-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 560px) {
  .pp-root { font-size: 15px; }
  .pp-head__right { width: 100%; }
  .pp-search { flex: 1; }
  .pp-search input { width: 100%; max-width: none; }
  .pp-tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
  .pp-memo__head { flex-wrap: wrap; }
  .pp-memo__amt { align-items: flex-start; width: 100%; margin-top: 4px; padding-left: 46px; }
  .pp-memo__amtval { font-size: 18px; }
  .pp-slots { grid-template-columns: 1fr; }
  .pp-foot { flex-direction: column; align-items: stretch; }
  .pp-foot .pp-btn { justify-content: center; }
  .pp-foot__spacer { display: none; }
}
</style>
