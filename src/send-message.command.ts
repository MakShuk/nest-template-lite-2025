import { Command, CommandRunner } from 'nest-commander';

const TEST_MESSAGE = 'Test message';

@Command({
  name: 'send-message',
  description: 'Print a test message',
})
export class SendMessageCommand extends CommandRunner {
  async run(): Promise<void> {
    process.stdout.write(`${TEST_MESSAGE}\n`);
  }
}
