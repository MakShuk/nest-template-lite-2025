import { Injectable } from '@nestjs/common';
import { Telegraf } from 'telegraf';

import { AppConfigService } from '../configs/config.service';

export type TelegramParseMode = 'HTML' | 'Markdown' | 'MarkdownV2';

type SendTelegramMessageOptions = {
  text: string;
  chatId?: string;
  parseMode?: TelegramParseMode;
  disableWebPagePreview?: boolean;
};

@Injectable()
export class TelegramService {
  private readonly bot: Telegraf;

  constructor(private readonly appConfigService: AppConfigService) {
    this.bot = new Telegraf(this.appConfigService.telegramBotToken);
  }

  async sendMessage({
    text,
    chatId,
    parseMode = 'HTML',
    disableWebPagePreview = false,
  }: SendTelegramMessageOptions): Promise<void> {
    const normalizedText = text.trim();
    if (!normalizedText) {
      throw new Error('Message text cannot be empty');
    }

    const targetChatId = chatId?.trim() || this.appConfigService.telegramDefaultUser;
    const sendOptions: {
      parse_mode: TelegramParseMode;
      link_preview_options?: { is_disabled: boolean };
    } = {
      parse_mode: parseMode,
    };

    if (disableWebPagePreview) {
      sendOptions.link_preview_options = { is_disabled: true };
    }

    await this.bot.telegram.sendMessage(targetChatId, normalizedText, sendOptions);
  }
}
