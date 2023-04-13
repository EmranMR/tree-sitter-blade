# Repository
SRC_DIR := src

PARSER_REPO_URL ?= $(shell git -C $(SRC_DIR) remote get-url origin )
# the # in the sed pattern has to be escaped or it will be interpreted as a comment
PARSER_NAME ?= $(shell basename $(PARSER_REPO_URL) | cut -d '-' -f3 | sed 's\#.git\#\#')
UPPER_PARSER_NAME := $(shell echo $(PARSER_NAME) | tr a-z A-Z )

# install directory layout
PREFIX ?= /usr/local
INCLUDEDIR ?= $(PREFIX)/include
LIBDIR ?= $(PREFIX)/lib

# collect sources, and link if necessary
# Some Tree Sitter grammars include .cc files directly in others,
# so we shouldn't just wildcard select them all.
# Only collect known file names.
ifneq ("$(wildcard $(SRC_DIR)/parser.c)", "")
	SRC += $(SRC_DIR)/parser.c
endif
ifneq ("$(wildcard $(SRC_DIR)/scanner.c)", "")
	SRC += $(SRC_DIR)/scanner.c
endif
ifneq ("$(wildcard $(SRC_DIR)/parser.cc)", "")
    CPPSRC += $(SRC_DIR)/parser.cc
endif
ifneq ("$(wildcard $(SRC_DIR)/scanner.cc)", "")
    CPPSRC += $(SRC_DIR)/scanner.cc
endif

ifeq (, $(CPPSRC))
	ADDITIONALLIBS := 
else
	ADDITIONALLIBS := -lc++
endif

SRC += $(CPPSRC)
OBJ := $(addsuffix .o,$(basename $(SRC)))

CFLAGS ?= -O3 -Wall -Wextra -I$(SRC_DIR)
CXXFLAGS ?= -O3 -Wall -Wextra -I$(SRC_DIR)
override CFLAGS += -std=gnu99 -fPIC
override CXXFLAGS += -fPIC

LINKSHARED := $(LINKSHARED)-dynamiclib -Wl,
ifneq ($(ADDITIONALLIBS),)
  LINKSHARED := $(LINKSHARED)$(ADDITIONALLIBS),
endif
LINKSHARED := $(LINKSHARED)-install_name,$(LIBDIR)/libtree-sitter-$(PARSER_NAME).dylib,-rpath,@executable_path/../Frameworks

all: libtree-sitter-$(PARSER_NAME).dylib

libtree-sitter-$(PARSER_NAME).dylib: $(OBJ)
	$(CC) $(LDFLAGS) $(LINKSHARED) $^ $(LDLIBS) -o $@

install: all
	install -d '$(DESTDIR)$(LIBDIR)'
	install -m755 libtree-sitter-$(PARSER_NAME).dylib '$(DESTDIR)$(LIBDIR)'/libtree-sitter-$(PARSER_NAME).dylib
	install -d '$(DESTDIR)$(INCLUDEDIR)'/tree_sitter

clean:
	rm -f $(OBJ) libtree-sitter-$(PARSER_NAME).dylib
	rm -rf build/

.PHONY: all install clean
