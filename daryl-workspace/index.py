import asyncio
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(
    filename="error.log",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

load_dotenv()
from browser_use import Agent, ChatOpenAI, Browser, ChatGoogle


# llm = ChatOpenAI(
#     model="glm-4.1v-thinking-flashx",
#     api_key="a5a7238c8b1e4c739a6f2fa9bbfc6e19.ys5GDpCQc7eguLQO",
#     base_url="https://open.bigmodel.cn/api/paas/v4/",
# )

llm = ChatGoogle(
    model="gemini-2.5-flash", api_key="AIzaSyB20VTZozrmXt_f5SexUMlQfiU-oToqEbg"
)

# llm = ChatOpenAI(
#     model="qwen-vl-max-latest",
#     api_key="sk-ce6b91d4f026425dab732a4b5cb06e20",
#     base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
# )

extend_system_message = """
记住最重要的规则:
1、严格执行提示词中列出的每一步骤。
2、最后的输出结果，要用中文回答用户的问题。
"""

task_message = """
1、打开网页https://yzftest.woa.com/xv-test/html/admin/chat/home。
2、点击顶部菜单中的 "更多" 按钮，然后在更多按钮的下面点击 "设置" 按钮
3、等页面加载结束，点击 客服管理 下的 全部
4、右侧成员列表中返回第一页的数据内容
"""


browser = Browser(
    headless=False,
    storage_state="./yzftest.woa.com.json",
)


async def main():
    try:
        agent = Agent(
            task=task_message,
            browser=browser,
            llm=llm,
            message_context=extend_system_message,
            generate_gif=True,
            calculate_cost=True,
        )
        history = await agent.run()
        result = history.final_result()
        print(result)
    except Exception as e:
        logging.error(f"An error occurred: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(main())
