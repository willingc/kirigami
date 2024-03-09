import click

@click.command()
@click.option('--name', prompt='Your name',
              help='The person to greet.')
def kirigami(name):
    """Simple library to shape and cut textual data."""
    click.echo(f"Hello {name}!")

if __name__ == '__main__':
    kirigami()

