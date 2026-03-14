import { Command, CommandRunner, Option } from 'nest-commander';

type HelloCommandOptions = {
  name?: string;
};

@Command({
  name: 'hello',
  description: 'Test command that prints Hello World',
})
export class HelloCommand extends CommandRunner {
  async run(_passedParam: string[], options: HelloCommandOptions): Promise<void> {
    const greeting = options.name ? `Hello ${options.name}!` : 'Hello World!';

    console.log(greeting);
    console.log('nest-commander works inside Docker!');
  }

  @Option({
    flags: '-n, --name <string>',
    description: 'Optional name for greeting',
  })
  parseName(value: string): string {
    return value;
  }
}
