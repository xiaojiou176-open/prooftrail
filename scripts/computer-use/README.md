# Computer Use - Gemini Only

本目录收敛为 **google-genai SDK** 的 Gemini Computer Use 能力，不再依赖 OpenAI 或 langchain 中间层。

## 当前实现

| 项目 | 值 |
|------|----|
| **Provider** | Google Gemini |
| **默认模型** | `models/gemini-3.1-pro-preview` |
| **主入口** | `gemini-computer-use.py` |
| **API 方法** | `client.models.generate_content()` |
| **必需环境变量** | `GEMINI_API_KEY` |

## 安装

```bash
cd scripts/computer-use
pip install -r requirements.txt
```

## 环境变量

- `GEMINI_API_KEY`
- `GEMINI_MODEL_PRIMARY`（默认 `models/gemini-3.1-pro-preview`）
- `COMPUTER_USE_TASK`（可选，自定义任务指令）

## 使用

```bash
export GEMINI_API_KEY="xxx"
export GEMINI_MODEL_PRIMARY="models/gemini-3.1-pro-preview"   # 可选，默认即此值
export GEMINI_THINKING_LEVEL="high"                   # 可选，默认 high
# 高风险动作确认闸门（默认拒绝 delete/pay/send/purchase/submit）
export COMPUTER_USE_CONFIRM_HIGH_RISK="true"
python3 gemini-computer-use.py "分析当前屏幕，找到登录按钮并点击"
```

### 高风险动作确认闸门

- 运行期会在执行前检查 action 名称是否包含：`delete/pay/send/purchase/submit`。
- 默认拒绝这些动作，并返回可观测阻断结果。
- 只有显式设置 `COMPUTER_USE_CONFIRM_HIGH_RISK=true` 才会放行。

## 工作原理

```
┌─────────────────────────────────────────────────────┐
│                    你的电脑屏幕                      │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │        Chrome (完全正常的浏览器)              │   │
│   │                                             │   │
│   │   ┌─────────────────────────────────────┐   │   │
│   │   │        Stripe 支付页面               │   │   │
│   │   │                                     │   │   │
│   │   │   看起来完全像真人在操作！           │   │   │
│   │   │                                     │   │   │
│   │   └─────────────────────────────────────┘   │   │
│   └─────────────────────────────────────────────┘   │
│                                                     │
│   PyAutoGUI 在 OS 层面控制鼠标键盘                 │
│   ↑                                                │
│   AI 分析截图，决定下一步动作                       │
└─────────────────────────────────────────────────────┘
```

**为什么无法检测？**

1. **没有 WebDriver** - 不是 Playwright/Selenium
2. **没有 CDP 连接** - 不是 DevTools Protocol
3. **真实鼠标移动** - PyAutoGUI 产生真实的 OS 事件
4. **真实键盘输入** - 每个按键都是真实的
5. **无自动化标记** - 浏览器完全正常启动

## 安全提示

⚠️ **紧急停止**: 将鼠标移动到屏幕左上角

⚠️ 不要在脚本运行时移动窗口

⚠️ 确保目标窗口可见且在前台
