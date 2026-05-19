{
  description = "Kirigami development and deployment shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            bash
            caddy
            coreutils
            curl
            docker
            docker-compose
            git
            gnumake
            jq
            mise
            nodejs_24
            openssl
            pkg-config
            python313
            sqlite
            uv
            wget
            zlib
          ];

          shellHook = ''
            export KIRIGAMI_PYTHON_VERSION="''${KIRIGAMI_PYTHON_VERSION:-3.13}"
            export NEXT_PUBLIC_API_BASE_URL="''${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8000}"
            export KIRIGAMI_API_BASE_URL="''${KIRIGAMI_API_BASE_URL:-http://127.0.0.1:8000}"

            echo "Kirigami shell ready."
            echo "Run: mise run setup | mise run dev | mise run deploy | mise run test"
          '';
        };
      }
    );
}
