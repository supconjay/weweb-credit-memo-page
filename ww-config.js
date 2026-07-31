export default {
  editor: { label: { en: "Credit Memo Approvals" } },
  triggerEvents: [
    {
      name: "approve",
      label: { en: "On approve (slot 1 or 2)" },
      event: { id: "", index: 0, slot: 1, field: "Approval 1", approverField: "Approver 1", previous: false, value: true, userId: "", approverId: "", isAdminOverride: false, row: {} },
    },
    {
      name: "unapprove",
      label: { en: "On un-approve (slot 1 or 2)" },
      event: { id: "", index: 0, slot: 1, field: "Approval 1", approverField: "Approver 1", previous: true, value: false, userId: "", approverId: "", isAdminOverride: false, row: {} },
    },
    {
      name: "adminApprove",
      label: { en: "On admin approve" },
      event: { id: "", index: 0, field: "Admin Approval", approverField: "Admin Approver", previous: false, value: true, userId: "", approverId: "", row: {} },
    },
    {
      name: "adminUnapprove",
      label: { en: "On admin un-approve" },
      event: { id: "", index: 0, field: "Admin Approval", approverField: "Admin Approver", previous: true, value: false, userId: "", approverId: "", row: {} },
    },
    { name: "openMemo", label: { en: "On view details" }, event: { id: "", index: 0, row: {} } },
    { name: "decline", label: { en: "On decline" }, event: { id: "", index: 0, row: {} } },
    { name: "tabChange", label: { en: "On tab change" }, event: { tab: "all" } },
    { name: "pageChange", label: { en: "On page change" }, event: { page: 1 } },
  ],
  properties: {
    // ────────────────────────────────────────────────────────────────
    // Data
    // ────────────────────────────────────────────────────────────────
    // Bind the credit_memo collection. Accepts a plain array OR the full
    // collection object ({ data: [...] }).
    items: {
      label: { en: "Credit memos (collection)" },
      type: "Array",
      bindable: true,
      /* wwEditor:start */
      bindingValidation: { type: "array", tooltip: "Bind your credit_memo collection (or its `data` array)." },
      /* wwEditor:end */
      defaultValue: [
        {
          UID: "Credit Memo #38 - INV-HE918-2",
          Reason: "Waive the Lien fee",
          Status: "In Review",
          "Name (from Invoice)": ["INV-HE918-2"],
          Created: "2026-06-08T15:51:55.000Z",
          submitted_by_name: ["Marlene Puguon"],
          Amount: 700,
          "Approval 1": false,
          "Approval 2": false,
          "Approver 1": [],
          "Approver 2": [],
          lob_name: ["Repipe"],
          credit_memo_approvers_supabase_ids: ["9e0b1a2b-10c4-4b64-8fcf-cde66793d85a", "9343187c-f4b6-4d28-9969-0b45af4660a7"],
          id: "recV3RLW6oAib4nAl",
        },
        {
          UID: "Credit Memo #41 - INV-HE922-1",
          Reason: "Duplicate billing on second-floor rough-in",
          Status: "In Review",
          "Name (from Invoice)": ["INV-HE922-1"],
          Created: "2026-06-19T18:02:10.000Z",
          submitted_by_name: ["Andre Cole"],
          Amount: 1250,
          "Approval 1": true,
          "Approval 2": false,
          "Approver 1": ["recRIG8MWFcPzfyzt"],
          "Approver 2": [],
          lob_name: ["Plumbing"],
          credit_memo_approvers_supabase_ids: ["9e0b1a2b-10c4-4b64-8fcf-cde66793d85a"],
          id: "recQ2mLPz9Ab4nXk1",
        },
      ],
    },

    // ────────────────────────────────────────────────────────────────
    // Current user (this is what gates the checkboxes)
    // ────────────────────────────────────────────────────────────────
    // Bind your auth user's Supabase id. It is matched against the row's
    // approver-ids array (credit_memo_approvers_supabase_ids). Only a match
    // lets the user tick Approval 1 or Approval 2.
    currentUserId: {
      label: { en: "Current user id (Supabase)" },
      type: "Text",
      defaultValue: "",
      bindable: true,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Bind e.g. user.id. Matched against the row's approver-ids array to decide who can approve." },
      /* wwEditor:end */
    },
    // Optional. The user's *record* id as stored in Approver 1 / Approver 2
    // (Airtable rec… ids). Used to label a slot "Approved by you" and to stop
    // the same person from filling both approval slots.
    currentUserRecordId: {
      label: { en: "Current user record id (Approver field)" },
      type: "Text",
      defaultValue: "",
      bindable: true,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Optional. The id stored in Approver 1 / Approver 2 for this user (e.g. rec…). Enables 'Approved by you' and blocks one person from taking both slots." },
      /* wwEditor:end */
    },
    // Bind a role check, e.g. user.roles.includes('admin').
    isAdmin: {
      label: { en: "Is admin (role)" },
      type: "OnOff",
      defaultValue: false,
      bindable: true,
      /* wwEditor:start */
      propertyHelp: { tooltip: "Bind a formula such as user.role == 'Admin'. Reveals the admin approval row." },
      /* wwEditor:end */
    },

    // ────────────────────────────────────────────────────────────────
    // Approval rules
    // ────────────────────────────────────────────────────────────────
    requireApproverMatch: {
      label: { en: "Only listed approvers can approve" }, type: "OnOff", defaultValue: true, bindable: true, section: "settings",
    },
    allowWhenNoApprovers: {
      label: { en: "Allow anyone when approver list is empty" }, type: "OnOff", defaultValue: false, bindable: true, section: "settings",
    },
    preventDoubleApproval: {
      label: { en: "One person can't hold both approvals" }, type: "OnOff", defaultValue: true, bindable: true, section: "settings",
    },
    allowRevoke: {
      label: { en: "Allow un-checking own approval" }, type: "OnOff", defaultValue: true, bindable: true, section: "settings",
    },
    showAdminApproval: {
      label: { en: "Show admin approval row" }, type: "OnOff", defaultValue: true, bindable: true, section: "settings",
    },
    adminOverride: {
      label: { en: "Admins can tick either approval slot" }, type: "OnOff", defaultValue: true, bindable: true, section: "settings",
    },
    adminCompletes: {
      label: { en: "Admin approval alone completes the memo" }, type: "OnOff", defaultValue: false, bindable: true, section: "settings",
    },

    // ────────────────────────────────────────────────────────────────
    // Field mapping (exact field names in the collection)
    // ────────────────────────────────────────────────────────────────
    idKey: { label: { en: "Field: id" }, type: "Text", defaultValue: "id", bindable: true, section: "settings" },
    titleKey: { label: { en: "Field: title" }, type: "Text", defaultValue: "UID", bindable: true, section: "settings" },
    amountKey: { label: { en: "Field: amount" }, type: "Text", defaultValue: "Amount", bindable: true, section: "settings" },
    statusKey: { label: { en: "Field: status" }, type: "Text", defaultValue: "Status", bindable: true, section: "settings" },
    reasonKey: { label: { en: "Field: reason" }, type: "Text", defaultValue: "Reason", bindable: true, section: "settings" },
    invoiceKey: { label: { en: "Field: invoice" }, type: "Text", defaultValue: "Name (from Invoice)", bindable: true, section: "settings" },
    lobKey: { label: { en: "Field: line of business" }, type: "Text", defaultValue: "lob_name", bindable: true, section: "settings" },
    submittedByKey: { label: { en: "Field: submitted by" }, type: "Text", defaultValue: "submitted_by_name", bindable: true, section: "settings" },
    createdKey: { label: { en: "Field: created date" }, type: "Text", defaultValue: "Created", bindable: true, section: "settings" },
    approval1Key: { label: { en: "Field: approval 1 (boolean)" }, type: "Text", defaultValue: "Approval 1", bindable: true, section: "settings" },
    approval2Key: { label: { en: "Field: approval 2 (boolean)" }, type: "Text", defaultValue: "Approval 2", bindable: true, section: "settings" },
    approver1Key: { label: { en: "Field: approver 1 (id)" }, type: "Text", defaultValue: "Approver 1", bindable: true, section: "settings" },
    approver2Key: { label: { en: "Field: approver 2 (id)" }, type: "Text", defaultValue: "Approver 2", bindable: true, section: "settings" },
    approversKey: {
      label: { en: "Field: allowed approver ids" }, type: "Text", defaultValue: "credit_memo_approvers_supabase_ids", bindable: true, section: "settings",
      /* wwEditor:start */
      propertyHelp: { tooltip: "Array field holding the user ids allowed to approve this memo. Compared against 'Current user id'." },
      /* wwEditor:end */
    },
    adminApprovalKey: { label: { en: "Field: admin approval (boolean)" }, type: "Text", defaultValue: "Admin Approval", bindable: true, section: "settings" },
    adminApproverKey: { label: { en: "Field: admin approver (id)" }, type: "Text", defaultValue: "Admin Approver", bindable: true, section: "settings" },

    // ────────────────────────────────────────────────────────────────
    // Optional approver directory — resolves approver ids into names
    // ────────────────────────────────────────────────────────────────
    directory: {
      label: { en: "Approver directory (optional)" }, type: "Array", bindable: true, section: "settings",
      /* wwEditor:start */
      bindingValidation: { type: "array", tooltip: "Bind a users collection so approver ids render as names." },
      /* wwEditor:end */
      defaultValue: [],
    },
    directoryIdKey: { label: { en: "Directory: id field" }, type: "Text", defaultValue: "id", bindable: true, section: "settings" },
    directoryNameKey: { label: { en: "Directory: name field" }, type: "Text", defaultValue: "name", bindable: true, section: "settings" },

    // ────────────────────────────────────────────────────────────────
    // Layout / chrome
    // ────────────────────────────────────────────────────────────────
    title: { label: { en: "Title" }, type: "Text", defaultValue: "Credit Memo Approvals", bindable: true },
    subtitle: { label: { en: "Subtitle" }, type: "Text", defaultValue: "Two approvals are required before a credit memo can be issued.", bindable: true },
    showHeader: { label: { en: "Show header" }, type: "OnOff", defaultValue: true, bindable: true },
    searchable: { label: { en: "Show search" }, type: "OnOff", defaultValue: true, bindable: true },
    searchPlaceholder: { label: { en: "Search placeholder" }, type: "Text", defaultValue: "Search credit memos...", bindable: true },
    showSummary: { label: { en: "Show summary stats" }, type: "OnOff", defaultValue: true, bindable: true },
    showTabs: { label: { en: "Show filter tabs" }, type: "OnOff", defaultValue: true, bindable: true },
    defaultTab: {
      label: { en: "Default tab" }, type: "TextSelect",
      options: { options: [
        { value: "mine", label: { en: "Needs my approval" } },
        { value: "pending", label: { en: "In review" } },
        { value: "approved", label: { en: "Approved" } },
        { value: "all", label: { en: "All" } },
      ] },
      defaultValue: "mine", bindable: true,
    },
    sortBy: {
      label: { en: "Sort" }, type: "TextSelect",
      options: { options: [
        { value: "none", label: { en: "Collection order" } },
        { value: "newest", label: { en: "Newest first" } },
        { value: "oldest", label: { en: "Oldest first" } },
        { value: "amount", label: { en: "Largest amount first" } },
      ] },
      defaultValue: "none", bindable: true,
    },
    showOpen: { label: { en: "Show 'View details' button" }, type: "OnOff", defaultValue: true, bindable: true },
    openLabel: { label: { en: "View details label" }, type: "Text", defaultValue: "View details", bindable: true },
    showDecline: { label: { en: "Show 'Decline' button" }, type: "OnOff", defaultValue: false, bindable: true },
    declineLabel: { label: { en: "Decline label" }, type: "Text", defaultValue: "Decline", bindable: true },

    paginate: { label: { en: "Paginate" }, type: "OnOff", defaultValue: true, bindable: true },
    pageSize: { label: { en: "Cards per page" }, type: "Number", options: { min: 1, max: 100, step: 1 }, defaultValue: 8, bindable: true },

    // ────────────────────────────────────────────────────────────────
    // Labels
    // ────────────────────────────────────────────────────────────────
    approvalsLabel: { label: { en: "Approvals heading" }, type: "Text", defaultValue: "Approvals", bindable: true, section: "settings" },
    approval1Label: { label: { en: "Slot 1 label" }, type: "Text", defaultValue: "Approval 1", bindable: true, section: "settings" },
    approval2Label: { label: { en: "Slot 2 label" }, type: "Text", defaultValue: "Approval 2", bindable: true, section: "settings" },
    approveLabel: { label: { en: "Approve label" }, type: "Text", defaultValue: "Approve", bindable: true, section: "settings" },
    undoLabel: { label: { en: "Undo label" }, type: "Text", defaultValue: "Undo", bindable: true, section: "settings" },
    adminApprovalLabel: { label: { en: "Admin row label" }, type: "Text", defaultValue: "Admin approval", bindable: true, section: "settings" },
    adminApproveLabel: { label: { en: "Admin approve button" }, type: "Text", defaultValue: "Admin approve", bindable: true, section: "settings" },
    adminApprovedText: { label: { en: "Admin approved text" }, type: "Text", defaultValue: "Approved by admin", bindable: true, section: "settings" },
    adminPendingText: { label: { en: "Admin pending text" }, type: "Text", defaultValue: "Not applied", bindable: true, section: "settings" },
    adminBadgeLabel: { label: { en: "Admin badge label" }, type: "Text", defaultValue: "Admin", bindable: true, section: "settings" },
    youText: { label: { en: "Approved-by-you text" }, type: "Text", defaultValue: "Approved by you", bindable: true, section: "settings" },
    approvedText: { label: { en: "Approved text" }, type: "Text", defaultValue: "Approved", bindable: true, section: "settings" },
    awaitingText: { label: { en: "Awaiting text" }, type: "Text", defaultValue: "Awaiting approval", bindable: true, section: "settings" },
    assignedText: { label: { en: "Assigned-to prefix" }, type: "Text", defaultValue: "Assigned to", bindable: true, section: "settings" },
    completeNote: { label: { en: "Fully-approved note" }, type: "Text", defaultValue: "Fully approved — ready to process.", bindable: true, section: "settings" },
    secondApproverNote: { label: { en: "Second-approver note" }, type: "Text", defaultValue: "Your approval is recorded — a second approver is still required.", bindable: true, section: "settings" },
    notApproverNote: { label: { en: "Not-an-approver note" }, type: "Text", defaultValue: "You are not listed as an approver on this credit memo.", bindable: true, section: "settings" },
    amountLabel: { label: { en: "Amount caption" }, type: "Text", defaultValue: "Credit", bindable: true, section: "settings" },
    reasonLabel: { label: { en: "Reason caption" }, type: "Text", defaultValue: "Reason", bindable: true, section: "settings" },
    ofLabel: { label: { en: "'of' word" }, type: "Text", defaultValue: "of", bindable: true, section: "settings" },
    tabMineLabel: { label: { en: "Tab: needs my approval" }, type: "Text", defaultValue: "Needs my approval", bindable: true, section: "settings" },
    tabPendingLabel: { label: { en: "Tab: in review" }, type: "Text", defaultValue: "In review", bindable: true, section: "settings" },
    tabApprovedLabel: { label: { en: "Tab: approved" }, type: "Text", defaultValue: "Approved", bindable: true, section: "settings" },
    tabAllLabel: { label: { en: "Tab: all" }, type: "Text", defaultValue: "All", bindable: true, section: "settings" },
    statMineLabel: { label: { en: "Stat: awaiting you" }, type: "Text", defaultValue: "Awaiting you", bindable: true, section: "settings" },
    statPendingLabel: { label: { en: "Stat: in review" }, type: "Text", defaultValue: "In review", bindable: true, section: "settings" },
    statApprovedLabel: { label: { en: "Stat: fully approved" }, type: "Text", defaultValue: "Fully approved", bindable: true, section: "settings" },
    statValueLabel: { label: { en: "Stat: pending value" }, type: "Text", defaultValue: "Pending value", bindable: true, section: "settings" },
    emptyText: { label: { en: "Empty text" }, type: "Text", defaultValue: "No credit memos to show", bindable: true, section: "settings" },
    emptyMineText: { label: { en: "Empty text (needs my approval)" }, type: "Text", defaultValue: "Nothing is waiting on your approval", bindable: true, section: "settings" },
    emptySearchText: { label: { en: "Empty text (search)" }, type: "Text", defaultValue: "No credit memos match your search", bindable: true, section: "settings" },
    currencyPrefix: { label: { en: "Currency prefix" }, type: "Text", defaultValue: "$", bindable: true, section: "settings" },

    // ────────────────────────────────────────────────────────────────
    // Theme (standard across pp- components)
    // ────────────────────────────────────────────────────────────────
    primaryColor: { label: { en: "Primary color" }, type: "Color", defaultValue: "#10b981", bindable: true },
    accentColor: { label: { en: "Accent color" }, type: "Color", defaultValue: "#6366f1", bindable: true },
    darkMode: {
      label: { en: "Theme mode" }, type: "TextSelect",
      options: { options: [
        { value: "auto", label: { en: "Auto (system)" } },
        { value: "light", label: { en: "Light" } },
        { value: "dark", label: { en: "Dark" } },
      ] },
      defaultValue: "auto", bindable: true,
    },
    radius: { label: { en: "Corner radius (px)" }, type: "Number", options: { min: 0, max: 32, step: 1 }, defaultValue: 16, bindable: true },
    gap: { label: { en: "Section spacing (px)" }, type: "Number", options: { min: 0, max: 48, step: 1 }, defaultValue: 16, bindable: true },
  },
};
