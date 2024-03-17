import click
from click_default_group import DefaultGroup
import kirigami
from trogon import tui


@tui()
@click.group(cls=DefaultGroup, default='createdb', default_if_no_args=True)
@click.option(
    "--verbose", count=True, default=1, help="Increase verbosity level."
)
@click.pass_context
def cli(ctx, verbose):
    """Commands for shaping and cutting text"""
    ctx.ensure_object(dict)
    ctx.obj["verbose"] = verbose


@click.command()
def createDB():
    """Create the database."""
    print('created database')


@click.command()
def deleteDB():
    """Delete the database."""
    print('deleted database')


@click.command()
@click.option('--count', default=1,
              help='The number of times to execute.')
@click.argument('name')
def hello(count, name):
    """Say hello."""
    for x in range(count):
        click.echo(f"Hello {name}!")


cli.add_command(createDB)
cli.add_command(deleteDB)
cli.add_command(hello)

if __name__ == '__main__':
    cli(obj={})

