from __future__ import annotations

from kirigami.pep import parse_pep_metadata, pep_url


def test_pep_url_uses_zero_padded_slug() -> None:
    assert pep_url(751) == "https://peps.python.org/pep-0751/"


def test_parse_pep_metadata_extracts_roles() -> None:
    html = """
    <html><body>
      <h1>PEP 751 – Lock files again</h1>
      <dl>
        <dt>Author</dt><dd>Brett Cannon &lt;brett at python.org&gt;, Paul Moore</dd>
        <dt>Sponsor</dt><dd>Carol Willing</dd>
        <dt>PEP-Delegate</dt><dd>Pradyun Gedam</dd>
        <dt>Status</dt><dd>Final</dd>
        <dt>Type</dt><dd>Standards Track</dd>
        <dt>Post-History</dt><dd>01-Jan-2025</dd>
      </dl>
      <h2>Abstract</h2>
    </body></html>
    """

    metadata = parse_pep_metadata(html, source_url="https://peps.python.org/pep-0751/")

    assert metadata.number == 751
    assert metadata.title == "Lock files again"
    assert metadata.status == "Final"
    assert [person.name for person in metadata.authors] == ["Brett Cannon", "Paul Moore"]
    assert metadata.authors[0].email == "brett at python.org"
    assert [person.name for person in metadata.sponsors] == ["Carol Willing"]
    assert [person.name for person in metadata.delegates] == ["Pradyun Gedam"]


def test_parse_pep_metadata_accepts_legacy_bdfl_delegate() -> None:
    html = """
    <html><body>
      <h1>PEP 999 – Example</h1>
      <p>BDFL-Delegate:</p><p>Guido van Rossum</p>
      <p>Abstract</p>
    </body></html>
    """

    metadata = parse_pep_metadata(html, source_url="https://peps.python.org/pep-0999/")

    assert [person.name for person in metadata.delegates] == ["Guido van Rossum"]
