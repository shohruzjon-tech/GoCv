export enum AuditAction {
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_UPDATE_PROFILE = 'user_update_profile',
  USER_BLOCKED = 'user_blocked',
  USER_UNBLOCKED = 'user_unblocked',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  USER_IMPERSONATED = 'user_impersonated',

  CV_CREATED = 'cv_created',
  CV_UPDATED = 'cv_updated',
  CV_DELETED = 'cv_deleted',
  CV_PUBLISHED = 'cv_published',
  CV_AI_GENERATED = 'cv_ai_generated',
  CV_PDF_EXPORTED = 'cv_pdf_exported',

  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',

  TEMPLATE_CREATED = 'template_created',
  TEMPLATE_UPDATED = 'template_updated',
  TEMPLATE_DELETED = 'template_deleted',

  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPGRADED = 'subscription_upgraded',
  SUBSCRIPTION_CANCELLED = 'subscription_cancelled',

  AI_TOOL_USED = 'ai_tool_used',

  FEATURE_FLAG_TOGGLED = 'feature_flag_toggled',

  ADMIN_ACTION = 'admin_action',
  ADMIN_IMPERSONATE = 'admin_impersonate',
}
