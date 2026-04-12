from app.core.actions.executor import ActionExecutor
import platform

def test_action_executor_parsing():
    executor = ActionExecutor()

    # Test OPEN_APP parsing
    res = executor.execute_action("OPEN_APP(chrome)")
    assert "chrome" in res.lower()

    # Test SEARCH_WEB parsing
    res = executor.execute_action("SEARCH_WEB(weather)")
    assert "weather" in res.lower()

def test_system_status():
    executor = ActionExecutor()
    res = executor.get_system_status()
    assert "CPU" in res
    assert "RAM" in res
