import re

def callback(message):
    return re.sub(
        rb"(?im)^Co-Authored-By:[^\r\n]*noreply@anthropic\.com[^\r\n]*(?:\r?\n|$)",
        b"",
        message
    )
