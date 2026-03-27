import { describe, expect, it } from "vitest"
import { RUN_RECORD_SOURCE_LABEL, UNIVERSAL_RUN_STATUS_LABEL } from "./types"

describe("run record labels", () => {
  it("keeps beginner-friendly source labels", () => {
    expect(RUN_RECORD_SOURCE_LABEL.command).toBe("命令执行")
    expect(RUN_RECORD_SOURCE_LABEL.template).toBe("模板运行")
  })

  it("keeps beginner-friendly status labels", () => {
    expect(UNIVERSAL_RUN_STATUS_LABEL.waiting_user).toBe("等待用户输入")
    expect(UNIVERSAL_RUN_STATUS_LABEL.waiting_otp).toBe("等待验证码")
    expect(UNIVERSAL_RUN_STATUS_LABEL.success).toBe("成功")
    expect(UNIVERSAL_RUN_STATUS_LABEL.failed).toBe("失败")
  })
})
