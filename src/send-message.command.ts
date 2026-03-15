import { Command, CommandRunner, Option } from 'nest-commander';

import { TelegramParseMode, TelegramService } from './telegram/telegram.service';

type SendMessageCommandOptions = {
  text?: string;
  user?: string;
  parseMode?: TelegramParseMode;
};

const SUPPORTED_PARSE_MODES: TelegramParseMode[] = ['HTML', 'Markdown', 'MarkdownV2'];

@Command({
  name: 'send-message',
  description: 'Send a message to Telegram',
})
export class SendMessageCommand extends CommandRunner {
  constructor(private readonly telegramService: TelegramService) {
    super();
  }

  async run(passedParams: string[], options: SendMessageCommandOptions): Promise<void> {
    const textFromParams = passedParams.join(' ').trim();
    const text = options.text?.trim() || textFromParams;

    if (!text) {
      throw new Error('Message text is required. Use --text or pass text as positional arguments.');
    }

    const payload: {
      text: string;
      parseMode: TelegramParseMode;
      chatId?: string;
    } = {
      text,
      parseMode: options.parseMode ?? 'HTML',
    };

    if (options.user) {
      payload.chatId = options.user;
    }

    await this.telegramService.sendMessage(payload);

    const target = options.user ?? 'default user from env config';
    process.stdout.write(`Message sent to ${target}\n`);
  }

  @Option({
    flags: '-t, --text <string>',
    description: 'Message text',
  })
  parseText(value: string): string {
    return value;
  }

  @Option({
    flags: '-u, --user <string>',
    description: 'Telegram user/chat id. If omitted, TELEGRAM_DEFAULT_USER is used.',
  })
  parseUser(value: string): string {
    return value;
  }

  @Option({
    flags: '-p, --parse-mode <mode>',
    description: 'Parse mode: HTML, Markdown, MarkdownV2. Default: HTML.',
  })
  parseMode(value: string): TelegramParseMode {
    const normalized = value.trim() as TelegramParseMode;

    if (!SUPPORTED_PARSE_MODES.includes(normalized)) {
      throw new Error(
        `Unsupported parse mode: ${value}. Supported values: ${SUPPORTED_PARSE_MODES.join(', ')}`,
      );
    }

    return normalized;
  }
}
