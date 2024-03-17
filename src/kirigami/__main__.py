"""" __main__.py"""

import click

from . import kiri

@click.group()
def cli():
    pass


cli.add_command(kiri.ingest)
cli.add_command(kiri.pretty)
cli.add_command(kiri.display)
cli.add_command(kiri.celebrate)