import { memo, useState, type ChangeEvent } from "react"
import {
  PARAM_BASE_URL_INPUT_TEST_ID,
  PARAM_REGISTER_PASSWORD_INPUT_TEST_ID,
} from "../constants/testIds"
import { Button, Input, Switch } from "@uiq/ui"

export const defaultStartUrlRoutePath = "/register"

export interface ParamsState {
  baseUrl: string
  startUrl: string
  successSelector: string
  modelName: string
  geminiApiKey?: string
  registerPassword: string
  automationToken: string
  automationClientId: string
  headless: boolean
  midsceneStrict: boolean
}

interface ParamsPanelProps {
  params: ParamsState
  onChange: (patch: Partial<ParamsState>) => void
}

function ParamsPanel({ params, onChange }: ParamsPanelProps) {
  const [showToken, setShowToken] = useState(false)
  const [showGeminiApiKey, setShowGeminiApiKey] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  return (
    <div className="form-section">
      <h3 className="form-section-title">{"运行参数"}</h3>
      <div className="field-group">
        <div className="field">
          <label className="field-label" htmlFor="base-url">
            {"你要操作的网站地址（UIQ_BASE_URL）"}
          </label>
          <Input
            id="base-url"
            type="url"
            data-testid={PARAM_BASE_URL_INPUT_TEST_ID}
            value={params.baseUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ baseUrl: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="start-url">
            {"从哪个页面开始（START_URL）"}
          </label>
          <Input
            id="start-url"
            type="url"
            value={params.startUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ startUrl: e.target.value })}
            placeholder={`可留空；将自动使用网站地址 + ${defaultStartUrlRoutePath}`}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="success-selector">
            {"成功标记（选择器）"}
          </label>
          <Input
            id="success-selector"
            type="text"
            value={params.successSelector}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({ successSelector: e.target.value })
            }
            placeholder="例如：.success-message 或 #welcome"
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="model-name">
            {"Gemini 模型名称"}
          </label>
          <Input
            id="model-name"
            type="text"
            value={params.modelName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onChange({ modelName: e.target.value })}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="api-key">
            {"Gemini API Key（可选）"}
          </label>
          <div className="field-row">
            <Input
              id="api-key"
              type={showGeminiApiKey ? "text" : "password"}
              autoComplete="off"
              value={params.geminiApiKey ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange({ geminiApiKey: e.target.value })
              }
              placeholder="仅在本地/CI 注入 GEMINI_API_KEY 时填写"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="params-toggle-api-key-visibility"
              aria-controls="api-key"
              aria-pressed={showGeminiApiKey}
              onClick={() => setShowGeminiApiKey((v) => !v)}
            >
              {showGeminiApiKey ? "隐藏" : "显示"}
            </Button>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="register-password">
            {"注册密码（可选）"}
          </label>
          <div className="field-row">
            <Input
              id="register-password"
              type={showRegisterPassword ? "text" : "password"}
              data-testid={PARAM_REGISTER_PASSWORD_INPUT_TEST_ID}
              data-uiq-ignore-button-inventory="non-core-parameter-input"
              autoComplete="off"
              value={params.registerPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange({ registerPassword: e.target.value })
              }
              placeholder="仅在目标站点需要固定注册密码时填写"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="params-toggle-register-password-visibility"
              aria-controls="register-password"
              aria-pressed={showRegisterPassword}
              onClick={() => setShowRegisterPassword((v) => !v)}
            >
              {showRegisterPassword ? "隐藏" : "显示"}
            </Button>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="automation-token">
            {"访问令牌（API Token）"}
          </label>
          <div className="field-row">
            <Input
              id="automation-token"
              type={showToken ? "text" : "password"}
              autoComplete="off"
              value={params.automationToken}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onChange({ automationToken: e.target.value })
              }
              placeholder="仅在后端开启鉴权时填写"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              data-testid="params-toggle-token-visibility"
              aria-controls="automation-token"
              aria-pressed={showToken}
              onClick={() => setShowToken((v) => !v)}
            >
              {showToken ? "隐藏" : "显示"}
            </Button>
          </div>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="automation-client-id">
            {"客户端标识（Client ID）"}
          </label>
          <Input
            id="automation-client-id"
            type="text"
            autoComplete="off"
            value={params.automationClientId}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onChange({ automationClientId: e.target.value })
            }
            placeholder="首次自动生成，可手动修改"
          />
        </div>
        <div className="switch-group">
          <label className="switch-label" htmlFor="params-headless">
            <Switch
              id="params-headless"
              checked={params.headless}
              onCheckedChange={(value: boolean) => onChange({ headless: value })}
            />
            {"后台运行浏览器（Headless）"}
          </label>
          <label className="switch-label" htmlFor="params-midscene-strict">
            <Switch
              id="params-midscene-strict"
              checked={params.midsceneStrict}
              onCheckedChange={(value: boolean) => onChange({ midsceneStrict: value })}
            />
            {"严格识别页面元素（Midscene Strict）"}
          </label>
        </div>
      </div>
    </div>
  )
}

export default memo(ParamsPanel)
